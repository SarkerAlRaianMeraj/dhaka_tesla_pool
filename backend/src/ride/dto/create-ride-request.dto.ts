import { IsInt, Max, Min } from 'class-validator';
import { QuoteRideDto } from './quote-ride.dto';

/**
 * A passenger's request for a ride (FR-P2.1, P2.4).
 *
 * Extends `QuoteRideDto` rather than repeating its fields: a request and a preview
 * describe the same journey, so the two must never be able to disagree about what
 * "the same journey" means. Divergence here would let a client show one price and
 * book another.
 *
 * There is deliberately no client-supplied fare or distance field. The server prices
 * the ride from the zone grid it holds (FR-F1); a client that could send its own
 * price would be a client that can lie about one.
 */
export class CreateRideRequestDto extends QuoteRideDto {
  /**
   * 1-3, because the only Tesla in the brief is a 3-seater Bullet. This is a
   * temporary bound, not the real capacity rule: Phase 3 replaces it with a check
   * against the matched vehicle, so the number stops being a constant.
   */
  @IsInt({ message: 'seatsRequested must be a whole number' })
  @Min(1, { message: 'seatsRequested must be at least 1' })
  @Max(3, { message: 'seatsRequested cannot exceed 3' })
  seatsRequested: number;
}
