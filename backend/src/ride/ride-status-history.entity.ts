import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RideStatus } from '../common/enums/ride-status.enum';
import { Ride } from './ride.entity';

/**
 * Append-only record of a ride's state changes (PRD §5.3).
 *
 * The current state lives on `ride_requests.status` because that is what every read
 * and every match query needs; this table exists so the *path* is not lost. A ride
 * that went REQUESTED → MATCHED → CANCELLED and one that was never matched look
 * identical in `status` alone, and the difference is exactly what a support
 * question or a dispute needs (NFR-3).
 *
 * `from_status` is nullable because the first row of every ride is its creation:
 * there is no prior state to record.
 */
@Entity('ride_status_history')
@Index('idx_ride_status_history_ride_changed', ['ride', 'changedAt'])
export class RideStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** `CASCADE`: history has no meaning once its ride is gone. */
  @ManyToOne(() => Ride, (ride) => ride.statusHistory, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'ride_request_id' })
  ride: Ride;

  @Column({ type: 'varchar', length: 20, name: 'from_status', nullable: true })
  fromStatus: RideStatus | null;

  @Column({ type: 'varchar', length: 20, name: 'to_status' })
  toStatus: RideStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'changed_at' })
  changedAt: Date;
}
