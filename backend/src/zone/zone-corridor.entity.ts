import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Corridor } from './corridor.entity';
import { Zone } from './zone.entity';

/**
 * Explicit many-to-many between zones and corridors, so the pairing is queryable
 * in SQL and reviewable as a table rather than hidden inside a JSON array.
 */
@Entity('zone_corridors')
@Index('idx_zone_corridors_corridor', ['corridorId'])
export class ZoneCorridor {
  @PrimaryColumn({ type: 'uuid', name: 'zone_id' })
  zoneId: string;

  @PrimaryColumn({ type: 'uuid', name: 'corridor_id' })
  corridorId: string;

  @ManyToOne(() => Zone, (zone) => zone.corridors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  @ManyToOne(() => Corridor, (corridor) => corridor.zoneLinks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'corridor_id' })
  corridor: Corridor;
}
