import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthCoreModule } from '../common/auth/auth-core.module';
import { Corridor } from './corridor.entity';
import { Zone } from './zone.entity';
import { ZoneCorridor } from './zone-corridor.entity';
import { ZoneController } from './zone.controller';
import { ZoneService } from './zone.service';

@Module({
  // `Corridor` and `ZoneCorridor` are registered even though nothing queries them
  // directly: TypeORM builds relation metadata from the entities a module
  // declares, and `Zone#corridors` cannot be resolved without them.
  imports: [
    TypeOrmModule.forFeature([Zone, Corridor, ZoneCorridor]),
    AuthCoreModule,
  ],
  controllers: [ZoneController],
  providers: [ZoneService],
  exports: [ZoneService],
})
export class ZoneModule {}
