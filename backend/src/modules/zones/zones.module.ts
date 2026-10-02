import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCoreModule } from '../../common/auth/auth-core.module';
import { Corridor } from './corridor.entity';
import { Zone } from './zone.entity';
import { ZoneCorridor } from './zone-corridor.entity';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

@Module({
  // `Corridor` and `ZoneCorridor` are registered even though nothing queries them
  // directly: TypeORM builds relation metadata from the entities a module
  // declares, and `Zone#corridors` cannot be resolved without them.
  imports: [
    TypeOrmModule.forFeature([Zone, Corridor, ZoneCorridor]),
    AuthCoreModule,
  ],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
