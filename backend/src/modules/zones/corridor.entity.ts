import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ZoneCorridor } from './zone-corridor.entity';

/**
 * A named group of zones used by the matching rule. Two requests may share a Tesla
 * when they start in the same zone and their destinations fall in corridors that
 * overlap, so a zone can belong to more than one corridor — Mohakhali closes both
 * the Banani-Gulshan and Dhanmondi-Farmgate corridors, which is what allows Nusrat
 * and Shirin to ride together in the demo scenario.
 */
@Entity('corridors')
@Unique('uq_corridors_code', ['code'])
export class Corridor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 60 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @OneToMany(() => ZoneCorridor, (link) => link.corridor)
  zoneLinks: ZoneCorridor[];
}
