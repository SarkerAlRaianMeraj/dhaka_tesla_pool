import { RideStatus } from '../common/enums/ride-status.enum';
import { TeslaAvailability } from './tesla-availability.enum';

/**
 * A driver's Tesla as they see it on the `/tesla` page (D26).
 *
 * Both capacity and availability are echoed rather than merely stored, so the
 * summary a driver is looking at is the same record Phase 4 will make promises
 * about. A view that omitted them would leave the driver trusting a number and a
 * state they cannot see.
 */
export type TeslaView = {
  id: string;
  plate: string;
  model: string;
  capacity: number;
  availability: TeslaAvailability;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * The response for "the driver's own Tesla", wrapping absence explicitly.
 *
 * Returning a bare `null` from the controller does *not* produce the JSON literal
 * `null`. Nest serialises it to a zero-length body with no `Content-Type`, so the
 * client receives an empty response and `response.data` is `undefined` — which is
 * indistinguishable from a proxy having swallowed the payload. A page whose empty
 * state hangs on that distinction is one refactor away from showing "could not
 * load" to every driver who has not registered yet.
 *
 * Hence an envelope: 200 always, with `tesla` present and `null` when there is
 * nothing. A client can now tell the two apart without inspecting headers, and
 * "you have not registered yet" stays a 200 rather than becoming an error.
 */
export type MyTeslaView = {
  tesla: TeslaView | null;
};

/**
 * One matchable request in a driver's feed (FR-D3.3, FR-M2).
 *
 * A deliberately narrow projection. The driver needs to recognise the journey —
 * where it starts, where it is going, how many seats, roughly what it pays — and
 * nothing else. The passenger's identity is absent by design: this is a broadcast
 * of open requests to any online driver, so including who asked would turn the
 * feed into a directory of passengers (NFR-2).
 *
 * In Phase 3 `matchable` is always true, because the feed lists exactly the
 * `REQUESTED` rides. The flag exists so that Phase 4's pairwise filtering reads as
 * what it is — a narrowing of this list — rather than as a new endpoint.
 */
export type MatchableRideView = {
  id: string;
  pickupZoneCode: string;
  pickupZoneName: string;
  destinationZoneCode: string;
  destinationZoneName: string;
  seatsRequested: number;
  fareEstimatePoysha: number;
  status: RideStatus;
  matchable: boolean;
  createdAt: Date;
};
