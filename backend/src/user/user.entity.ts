import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One identity for both actors. `role` is the only thing that separates a
 * passenger from a driver, and it is copied into the JWT so authorisation never
 * has to hit the database to know who is calling (NFR-1).
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'password_hash',
    select: false,
  })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  role: string;

  /** TeslaPay simulated balance, in poysha. Never a float (FR-F2). */
  @Column({ type: 'integer', name: 'tesla_pay_balance_poysha', default: 0 })
  teslaPayBalancePoysha: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
