import { IsString, Matches, MaxLength } from 'class-validator';

/**
 * A fare preview for a journey that has not been requested (FR-P2.2).
 *
 * The client sends zone *codes* — `banani`, not a UUID — because the select list a
 * passenger picks from is built from `GET /zones`, and making the browser carry
 * opaque ids it cannot display would be a small, pointless complication. The
 * service resolves codes to zone rows and the stored ride keeps foreign keys (D22).
 *
 * Codes are constrained to lowercase snake_case rather than merely "a string",
 * because an unconstrained string is the shape of thing that ends up interpolated
 * into a lookup and silently matching nothing. The character class matches the
 * seeded codes exactly, which is the point: `gulshan_1` has an underscore in it,
 * and a stricter pattern would reject a zone the product ships with.
 */
export class QuoteRideDto {
  @IsString({ message: 'pickupZoneCode must be a zone code' })
  @MaxLength(40)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'pickupZoneCode must be a lowercase zone code',
  })
  pickupZoneCode: string;

  @IsString({ message: 'destinationZoneCode must be a zone code' })
  @MaxLength(40)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'destinationZoneCode must be a lowercase zone code',
  })
  destinationZoneCode: string;
}
