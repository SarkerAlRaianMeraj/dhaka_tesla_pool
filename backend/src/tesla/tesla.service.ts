import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Ride } from '../ride/ride.entity';
import { RideStatus } from '../common/enums/ride-status.enum';
import { ZoneService } from '../zone/zone.service';
import { RegisterTeslaDto } from './dto/register-tesla.dto';
import { TeslaAvailability } from './tesla-availability.enum';
import { Tesla } from './tesla.entity';
import { MatchableRideView, TeslaView } from './tesla.types';

/**
 * A driver's Tesla, its availability, and the open requests it could serve.
 *
 * ## What is guaranteed here versus in the database
 *
 * Two rules are enforced by constraints rather than by this service, and both
 * because a check-then-insert is only true until two requests arrive at once:
 *
 * - one Tesla per driver (`uq_teslas_driver`), and
 * - one Tesla per plate (`uq_teslas_plate`).
 *
 * This service still translates those violations into 409s with readable messages,
 * because "unique constraint failed" is not something a driver can act on.
 *
 * ## What is deliberately not here yet
 *
 * Error E2 — a driver going offline while owing a ride — needs an assignment to
 * exist, and rides do not carry a driver until Phase 4 introduces accepting and
 * pooling. So `setAvailability` currently only records the choice; the guard that
 * refuses to strand a passenger arrives with the state it protects. Phase 3 makes
 * no claim about that error case, and E2 stays on the Phase 4 list.
 */
@Injectable()
export class TeslaService {
  /**
   * The only vehicle in the brief is a 3-seater Bullet, so capacity has a
   * defensible default and registration needs one field, not two.
   */
  private static readonly DEFAULT_CAPACITY = 3;

  private static readonly DRIVER_CONSTRAINT = 'uq_teslas_driver';
  private static readonly PLATE_CONSTRAINT = 'uq_teslas_plate';

  constructor(
    @InjectRepository(Tesla)
    private readonly teslaRepository: Repository<Tesla>,
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    private readonly zoneService: ZoneService,
  ) {}

  /**
   * Registers the driver's Tesla, once (FR-D3.1, US-D2).
   *
   * The plate is normalised before storage so that " Dhaka 11-7788" and
   * "DHAKA 11-7788" cannot become two vehicles that a human reads as one. The
   * unique index would accept both, so normalisation is what makes it enforce the
   * rule the product meant.
   */
  async register(dto: RegisterTeslaDto, driverId: string): Promise<TeslaView> {
    const plate = TeslaService.normalizePlate(dto.plate);
    if (plate.length === 0) {
      throw new BadRequestException('plate must contain a registration number');
    }

    const tesla = this.teslaRepository.create({
      driver: { id: driverId } as Tesla['driver'],
      plate,
      capacity: dto.capacity ?? TeslaService.DEFAULT_CAPACITY,
      availability: TeslaAvailability.OFFLINE,
    });

    try {
      const saved = await this.teslaRepository.save(tesla);
      return TeslaService.toView(saved);
    } catch (error) {
      throw TeslaService.explainConflict(error);
    }
  }

  /**
   * The driver's own Tesla, or `null` when they have not registered one.
   *
   * Absence is returned rather than thrown, because "I have not registered yet" is
   * the ordinary opening state of the `/tesla` page (D26), not a failure. Making it
   * a 404 would force the page to treat a routine empty state as an error and
   * risk showing "could not load" on the one screen whose whole job is to offer
   * the form.
   */
  async findMine(driverId: string): Promise<TeslaView | null> {
    const tesla = await this.teslaRepository.findOne({
      where: { driver: { id: driverId } },
    });
    return tesla === null ? null : TeslaService.toView(tesla);
  }

  /**
   * Records the driver's choice about receiving new requests (FR-D3.2, US-D2).
   *
   * Refuses when there is no Tesla, because "go online" is not a thing a driver
   * without a vehicle can do, and silently accepting it would let the UI show a
   * green online state backed by nothing.
   *
   * A registration cannot be replaced or edited: capacity is fixed at creation
   * (US-D2) and the plate identifies the vehicle, so there is no update endpoint
   * and therefore no way to change what Phase 4 reasons about.
   */
  async setAvailability(
    driverId: string,
    availability: TeslaAvailability,
  ): Promise<TeslaView> {
    const tesla = await this.requireByDriver(driverId);
    tesla.availability = availability;
    return TeslaService.toView(await this.teslaRepository.save(tesla));
  }

  /**
   * Open requests a driver's Tesla could serve (FR-D3.3, FR-M2).
   *
   * The list is every `REQUESTED` ride, newest first. In Phase 3 it is not
   * narrowed pairwise, because the rule in `matching.ts` compares two requests
   * and this driver has no pool yet, so there is nothing to compare against (D27).
   * Phase 4 filters this same list once a first request anchors the driver's pool.
   *
   * Requiring a Tesla keeps the endpoint honest: without a vehicle there is
   * nothing for these requests to match to, and an empty feed would read as "no
   * demand" rather than "you have not registered".
   */
  async listMatchableRides(driverId: string): Promise<MatchableRideView[]> {
    await this.requireByDriver(driverId);

    const rides = await this.rideRepository.find({
      where: { status: RideStatus.REQUESTED },
      relations: { pickupZone: true, destinationZone: true },
      order: { createdAt: 'DESC' },
    });

    return rides.map((ride) => ({
      id: ride.id,
      pickupZoneCode: ride.pickupZone.code,
      pickupZoneName: ride.pickupZone.name,
      destinationZoneCode: ride.destinationZone.code,
      destinationZoneName: ride.destinationZone.name,
      seatsRequested: ride.seatsRequested,
      fareEstimatePoysha: ride.fareEstimatePoysha,
      status: ride.status,
      // Always true here, and stated explicitly so Phase 4's filtering reads as a
      // narrowing of this list rather than as a different endpoint.
      matchable: true,
      createdAt: ride.createdAt,
    }));
  }

  private async requireByDriver(driverId: string): Promise<Tesla> {
    const tesla = await this.teslaRepository.findOne({
      where: { driver: { id: driverId } },
    });
    if (tesla === null) {
      throw new NotFoundException('Register your Tesla before doing that');
    }
    return tesla;
  }

  /**
   * Trimmed, upper-cased, and with internal whitespace collapsed.
   *
   * Collapsing matters more than it looks: without it `DHAKA 11-7788` and
   * `DHAKA  11-7788` pass the unique index as two distinct plates while meaning
   * the same vehicle to every human and to the traffic police.
   */
  private static normalizePlate(plate: string): string {
    return plate.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  /**
   * Turns a unique-constraint violation into something the caller can act on.
   *
   * Anything that is not a recognised violation is rethrown untouched, so a real
   * fault is never dressed up as a conflict.
   */
  private static explainConflict(error: unknown): unknown {
    if (error instanceof QueryFailedError) {
      const driverError = (
        error as unknown as {
          driverError?: { code?: string; constraint?: string };
        }
      ).driverError;

      if (driverError?.code === '23505') {
        if (driverError.constraint === TeslaService.DRIVER_CONSTRAINT) {
          return new ConflictException(
            'You have already registered a Tesla (US-D2)',
          );
        }
        if (driverError.constraint === TeslaService.PLATE_CONSTRAINT) {
          return new ConflictException('That plate is already registered');
        }
      }
    }
    return error;
  }

  private static toView(tesla: Tesla): TeslaView {
    return {
      id: tesla.id,
      plate: tesla.plate,
      model: tesla.model,
      capacity: tesla.capacity,
      availability: tesla.availability,
      createdAt: tesla.createdAt,
      updatedAt: tesla.updatedAt,
    };
  }
}
