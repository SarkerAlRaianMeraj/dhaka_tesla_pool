import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RideStatus } from '../common/enums/ride-status.enum';
import { User } from '../user/user.entity';
import { Zone } from '../zone/zone.entity';
import { RideStatusHistory } from './ride-status-history.entity';

/**
 * One passenger's request for a ride, and everything the platform needs to price it
 * and later match it (PRD §5.1).
 *
 * Two design points are load-bearing:
 *
 * **Zones are foreign keys, not strings (D22).** The SRS conceptual model shows
 * `pickupZone` and `destinationZone` as strings, but FR-DB1 asks for real
 * relationships and constraints throughout. A string cannot enforce that a zone
 * exists, and two requests could spell the same place differently and then never
 * match each other. The API still accepts codes; the service resolves them.
 *
 * **The estimate is stored, not recomputed.** `distanceKm` and
 * `fareEstimatePoysha` are recorded at request time so the price the passenger was
 * shown cannot drift if the fare rule or a zone coordinate is later corrected. The
 * pooled fare is *not* stored, because it depends on occupancy that is unknown until
 * the trip starts (PRD §6.2).
 */
@Entity('ride_requests')
@Index('idx_ride_requests_passenger_created', ['passenger', 'createdAt'])
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * `CASCADE` on delete: a ride is meaningless without its passenger, and the
   * identity tables own their rows (FR-DB1).
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'passenger_id' })
  passenger: User;

  /**
   * `RESTRICT` rather than `CASCADE`: zones are reference data the whole product
   * matches on, so deleting one that rides point at must fail loudly instead of
   * silently erasing history.
   */
  @ManyToOne(() => Zone, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'pickup_zone_id' })
  pickupZone: Zone;

  @ManyToOne(() => Zone, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'destination_zone_id' })
  destinationZone: Zone;

  /** Seats asked for, 1-3 (FR-P2.1). Capacity is validated against the Tesla in Phase 3. */
  @Column({ type: 'smallint', name: 'seats_requested' })
  seatsRequested: number;

  /** Manhattan distance on the zone grid, kept so the shown price stays auditable. */
  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'distance_km' })
  distanceKm: string;

  /**
   * The solo estimate in whole poysha, as shown to the passenger (FR-F2). Never a
   * float and never negative.
   */
  @Column({ type: 'integer', name: 'fare_estimate_poysha' })
  fareEstimatePoysha: number;

  @Column({ type: 'varchar', length: 20, default: RideStatus.REQUESTED })
  status: RideStatus;

  /**
   * The audit trail. Every state change appends a row instead of overwriting, so
   * "when did this ride stop being matchable?" is answerable later (NFR-3).
   */
  @OneToMany(() => RideStatusHistory, (history) => history.ride)
  statusHistory: RideStatusHistory[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
