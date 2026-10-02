/**
 * The only two roles in the MVP (SRS §1.2). The brief uses different names for
 * the same people ("passenger" in the interface, "rider" in the matching rules,
 * "driver"/"Tesla owner" for the pool owner), so this enum is the single place
 * where those words are collapsed into one value that is stored, sent in the JWT,
 * and checked by the guards.
 */
export enum Role {
  Passenger = 'passenger',
  Driver = 'driver',
}

export const ALL_ROLES: Role[] = [Role.Passenger, Role.Driver];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && ALL_ROLES.includes(value as Role);
}
