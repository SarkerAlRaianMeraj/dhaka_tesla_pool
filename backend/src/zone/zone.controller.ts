import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZoneView, ZoneService } from './zone.service';

/**
 * Public within an authenticated session but still guarded: the zone list is
 * reference data for the app, not a public API surface.
 */
@Controller('zones')
@UseGuards(JwtAuthGuard)
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Get()
  list(): Promise<ZoneView[]> {
    return this.zoneService.list();
  }
}
