import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZoneView, ZonesService } from './zones.service';

/**
 * Public within an authenticated session but still guarded: the zone list is
 * reference data for the app, not a public API surface.
 */
@Controller('zones')
@UseGuards(JwtAuthGuard)
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  list(): Promise<ZoneView[]> {
    return this.zones.list();
  }
}
