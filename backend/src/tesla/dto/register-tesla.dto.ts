import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * A driver's one-time Tesla registration (FR-D3.1, US-D2).
 *
 * There is no client-supplied `model`, `availability`, or driver id. The vehicle
 * model is the same for everyone in the brief, availability is the driver's later
 * choice rather than a claim they can make at signup, and identity comes from the
 * token — a body field that could name another driver would be a way to register a
 * Tesla for someone else.
 */
export class RegisterTeslaDto {
  /** The registration plate. Trimmed and upper-cased server-side before storage. */
  @IsString({ message: 'plate must be a string' })
  @MinLength(1, { message: 'plate must not be empty' })
  @MaxLength(20, { message: 'plate cannot exceed 20 characters' })
  plate: string;

  /**
   * Seats available to passengers, fixed for the life of the Tesla (US-D2).
   *
   * Optional, because the only vehicle in the brief is a 3-seater Bullet and
   * making every driver state the obvious is a form field that exists only to be
   * wrong. When supplied it is still validated, so the capacity rule is real and
   * testable rather than a constant in disguise.
   *
   * `ValidateIf` is load-bearing rather than decorative. The global `ValidationPipe`
   * leaves `skipMissingProperties` off, which is right — it stops a required field
   * from slipping through as `undefined` — but it also means these decorators would
   * reject an *absent* `capacity` and make the field mandatory after all, reporting
   * three errors for a form that simply left it blank. The condition is
   * `capacity !== undefined` rather than a truthiness test, so `capacity: 0` is
   * still rejected by `@Min` instead of quietly being read as "not supplied".
   */
  @ValidateIf((dto: RegisterTeslaDto) => dto.capacity !== undefined)
  @IsInt({ message: 'capacity must be a whole number' })
  @Min(1, { message: 'capacity must be at least 1' })
  @Max(3, { message: 'capacity cannot exceed 3' })
  capacity?: number;
}
