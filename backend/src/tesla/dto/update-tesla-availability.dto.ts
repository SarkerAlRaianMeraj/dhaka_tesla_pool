import { IsEnum } from 'class-validator';
import { TeslaAvailability } from '../tesla-availability.enum';

/**
 * The driver's own choice about whether to receive new requests (FR-D3.2, US-D2).
 *
 * The availability is the entire body, and it is the *driver's* to set: a client
 * cannot name a Tesla, so it cannot toggle somebody else's offer to work.
 */
export class UpdateTeslaAvailabilityDto {
  @IsEnum(TeslaAvailability, {
    message: `availability must be one of: ${Object.values(TeslaAvailability).join(', ')}`,
  })
  availability: TeslaAvailability;
}
