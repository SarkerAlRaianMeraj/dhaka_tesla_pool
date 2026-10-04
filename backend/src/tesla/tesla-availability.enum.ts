/**
 * Whether a driver's Tesla is currently offering rides.
 *
 * Only two states, and that is deliberate. `US-D2` describes availability as a
 * choice the driver makes, and error E2 says going offline while owing a ride
 * does not cancel it — so "online" describes willingness to receive *new*
 * requests, never the fate of an assignment already made (D26).
 */
export enum TeslaAvailability {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
}

export const isTeslaAvailability = (
  value: unknown,
): value is TeslaAvailability =>
  value === TeslaAvailability.OFFLINE || value === TeslaAvailability.ONLINE;
