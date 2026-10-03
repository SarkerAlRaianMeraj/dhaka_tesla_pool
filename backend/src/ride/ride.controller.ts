import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/authenticated-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { QuoteRideDto } from './dto/quote-ride.dto';
import { RideService } from './ride.service';
import { QuoteView, RideView } from './ride.types';

/**
 * Everything a passenger does with a ride they own.
 *
 * The guard is applied to the whole controller rather than per route: not one of
 * these endpoints means anything without knowing who is asking, and an endpoint
 * added later without the decorator would then be public by omission.
 */
@Controller('rides')
@UseGuards(JwtAuthGuard)
export class RideController {
  constructor(private readonly rideService: RideService) {}

  /**
   * Prices a journey, persisting nothing (FR-P2.2).
   *
   * 201 is not appropriate here even though this is a POST: nothing was created.
   */
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() quoteRideDto: QuoteRideDto): Promise<QuoteView> {
    return this.rideService.quote(quoteRideDto);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Body() createRideRequestDto: CreateRideRequestDto,
    @CurrentUser() passenger: AuthenticatedUser,
  ): Promise<RideView> {
    return this.rideService.createRequest(createRideRequestDto, passenger.id);
  }

  @Get()
  listMine(@CurrentUser() passenger: AuthenticatedUser): Promise<RideView[]> {
    return this.rideService.listMine(passenger.id);
  }

  /**
   * `:id` is validated as a UUID before the service runs, so a malformed id is a
   * 400 about the format rather than a 404 that suggests the ride might exist.
   */
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() passenger: AuthenticatedUser,
  ): Promise<RideView> {
    return this.rideService.findOneOwned(rideId, passenger.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id', new ParseUUIDPipe()) rideId: string,
    @CurrentUser() passenger: AuthenticatedUser,
  ): Promise<RideView> {
    return this.rideService.cancel(rideId, passenger.id);
  }
}
