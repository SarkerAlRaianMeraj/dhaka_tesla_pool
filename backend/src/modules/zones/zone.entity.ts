import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Corridor } from './corridor.entity';

/**
 * The predefined Dhaka areas the whole product is built on (FR-M1). Geography is
 * deliberately a list, not a map: `x_km` and `y_km` are a published grid in
 * kilometres, and the fare model measures distance on it, so any fare can be
 * checked by hand with a calculator.
 */
@Entity('zones')
@Unique('uq_zones_code', ['code'])
@Index('idx_zones_coordinates', ['xKm', 'yKm'])
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Stable machine name used in requests and seeds, e.g. `banani`. */
  @Column({ type: 'varchar', length: 40 })
  code: string;

  /** Human name shown in the UI, e.g. `Banani`. */
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'x_km' })
  xKm: string;

  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'y_km' })
  yKm: string;

  @ManyToMany(() => Corridor, (corridor) => corridor.zoneLinks)
  @JoinTable({
    name: 'zone_corridors',
    joinColumn: { name: 'zone_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'corridor_id', referencedColumnName: 'id' },
  })
  corridors: Corridor[];
}
