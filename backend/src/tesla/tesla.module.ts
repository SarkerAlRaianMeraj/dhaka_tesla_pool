import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCoreModule } from '../common/auth/auth-core.module';
import { Ride } from '../ride/ride.entity';
import { ZoneModule } from '../zone/zone.module';
import { TeslaController } from './tesla.controller';
import { Tesla } from './tesla.entity';
import { TeslaService } from './tesla.service';

/**
 * `Ride` is registered here because the driver feed reads `ride_requests`, and
 * `ZoneModule` is imported because the feed labels each request with its pickup
 * and destination (FR-D3.3).
 *
 * `AuthCoreModule` is imported for the guard's own dependency rather than for a
 * service this module uses: `JwtAuthGuard` takes `JwtService`, and a controller
 * decorator cannot inject it. Without this the application fails to start with
 * `UnknownDependenciesException`, which typecheck and unit tests cannot see —
 * both resolve the controller without building the module's injector.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Tesla, Ride]),
    ZoneModule,
    AuthCoreModule,
  ],
  controllers: [TeslaController],
  providers: [TeslaService],
})
export class TeslaModule {}
