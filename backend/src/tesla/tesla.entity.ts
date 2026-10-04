import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { TeslaAvailability } from './tesla-availability.enum';

/**
 * The Tesla a driver offers rides in (PRD §5.1, US-D2).
 *
 * Three properties are load-bearing for later phases:
 *
 * **One Tesla per driver, enforced by the schema.** `uq_teslas_driver` means "you
 * already own one" is a fact the database guarantees rather than a query the
 * service hopes is not racing. Phase 4's capacity reasoning assumes a driver's
 * seats live in exactly one place.
 *
 * **Capacity is fixed at registration and never edited.** Phase 4's central
 * guarantee is that occupancy cannot exceed capacity; a capacity that can be
 * lowered while passengers are aboard would make that guarantee conditional on
 * nobody choosing to.
 *
 * **Availability is state about new work, not about assignments already made.**
 * A driver who goes offline mid-ride still owes that ride (E2), so nothing here
 * is allowed to imply otherwise.
 */
@Entity('teslas')
@Unique('uq_teslas_driver', ['driver'])
@Unique('uq_teslas_plate', ['plate'])
@Index('idx_teslas_availability', ['availability'])
export class Tesla {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** `CASCADE`: a Tesla has no meaning without its driver. */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  /**
   * The registration number, unique across the fleet. Upper-cased on the way in
   * so " Dhaka 11-7788" and "DHAKA 11-7788" cannot both exist.
   */
  @Column({ type: 'varchar', length: 20 })
  plate: string;

  @Column({ type: 'varchar', length: 60, default: 'Tesla Model 3' })
  model: string;

  /** Seats available to passengers, 1-3. Fixed at registration (US-D2). */
  @Column({ type: 'smallint' })
  capacity: number;

  /**
   * Whether the driver is currently offering rides.
   *
   * Deliberately named `availability` rather than `status`, matching US-D2's own
   * word for it. `status` in this project belongs to ride lifecycle (D22), and a
   * Tesla's `availability` is not a point on that lifecycle: there is no ordering,
   * no history requirement, and nothing that transitions it automatically.
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: TeslaAvailability.OFFLINE,
  })
  availability: TeslaAvailability;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
