import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './zone.entity';

export type ZoneView = {
  id: string;
  code: string;
  name: string;
  xKm: number;
  yKm: number;
  corridors: { code: string; name: string }[];
};

/**
 * The zone list is reference data rather than user data: it changes only through
 * a migration or a seed. It is read by nearly every screen, so it is loaded once
 * and held in memory; `invalidate()` exists for the future admin path and costs
 * nothing today.
 */
@Injectable()
export class ZonesService {
  private cache: ZoneView[] | null = null;

  constructor(
    @InjectRepository(Zone) private readonly zones: Repository<Zone>,
  ) {}

  async list(): Promise<ZoneView[]> {
    this.cache ??= await this.load();
    return this.cache;
  }

  async findByCode(code: string): Promise<ZoneView | null> {
    return (await this.list()).find((zone) => zone.code === code) ?? null;
  }

  /**
   * Resolves zone codes for a request, rejecting anything unknown. Ride and
   * matching features use this so a typo fails loudly at the edge instead of
   * producing a request nobody can be matched against.
   */
  async requireByCodes(codes: string[]): Promise<ZoneView[]> {
    const zones = await this.list();
    const found: (ZoneView | undefined)[] = codes.map((code) =>
      zones.find((zone) => zone.code === code),
    );

    const missing = codes.filter((_, index) => found[index] === undefined);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unknown zone${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }

    return found.filter((zone): zone is ZoneView => zone !== undefined);
  }

  private async load(): Promise<ZoneView[]> {
    // The ManyToMany join resolves to Corridor rows directly, so one query is
    // enough — no second lookup table to stitch together.
    const zoneRows = await this.zones.find({
      relations: { corridors: true },
      order: { code: 'ASC' },
    });

    return zoneRows.map((zone) => ({
      id: zone.id,
      code: zone.code,
      name: zone.name,
      xKm: Number(zone.xKm),
      yKm: Number(zone.yKm),
      corridors: (zone.corridors ?? [])
        .map((corridor) => ({ code: corridor.code, name: corridor.name }))
        .sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }
}
