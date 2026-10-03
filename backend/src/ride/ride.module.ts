import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCoreModule } from '../common/auth/auth-core.module';
import { ZoneModule } from '../zone/zone.module';
import { Ride } from './ride.entity';
import { RideStatusHistory } from './ride-status-history.entity';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, RideStatusHistory]),
    // `AuthCoreModule` rather than `AuthModule`: the guard needs to verify a JWT,
    // and importing the whole auth module would drag registration and password
    // hashing into a module that has no use for them (D21).
    AuthCoreModule,
    // Imported for `ZoneService.requireByCodes`, which is how a client-supplied
    // zone code becomes a zone row (D22).
    ZoneModule,
  ],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RideModule {}
