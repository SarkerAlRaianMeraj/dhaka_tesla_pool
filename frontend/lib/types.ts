export type Role = "passenger" | "driver";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teslaPayBalancePoysha: number;
};

/** The login response body carries no token - it travels in an httpOnly cookie. */
export type LoginResponse = {
  message: string;
  expiresInSeconds: number;
  user: SessionUser;
};

export type RegisterResponse = {
  message: string;
  user: SessionUser;
};

export type Zone = {
  id: string;
  code: string;
  name: string;
  xKm: number;
  yKm: number;
  corridors: { code: string; name: string }[];
};

/**
 * The ride lifecycle, mirroring the API's `RideStatus` enum.
 *
 * The union is written out rather than derived from the API response so a typo in
 * a status is a compile error here instead of an unstyled badge at runtime. The
 * full set is present even though Phase 2 only enters `REQUESTED` and `CANCELLED`,
 * because matching arrives in Phase 3 and the values already exist server-side.
 */
export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "ACCEPTED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";

/**
 * A zone as it appears inside a ride.
 *
 * Distinct from `Zone` because the API omits `corridors` here; no screen in Phase 2
 * shows a ride's corridors, and typing them as present would invite reading
 * `undefined.length` into a crash.
 */
export type RideZone = Omit<Zone, "corridors">;

/**
 * A fare preview. Every field is shown to the passenger before they commit
 * (FR-F1), and the breakdown is kept in the response so the screen can render the
 * same lines again on the detail page without recomputing anything.
 */
export type RideQuote = {
  distanceKm: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  fareEstimatePoysha: number;
  /** Always false in Phase 2: no Tesla exists yet when a request is priced. */
  pooled: boolean;
};

export type RideStatusHistoryEntry = {
  id: string;
  fromStatus: RideStatus | null;
  toStatus: RideStatus;
  statusLabel: string;
  changedAt: string;
};

export type Ride = {
  id: string;
  passengerId: string;
  pickupZone: RideZone;
  destinationZone: RideZone;
  seatsRequested: number;
  distanceKm: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  fareEstimatePoysha: number;
  status: RideStatus;
  /** Plain-language status from the API; never render the raw enum to a passenger. */
  statusLabel: string;
  /** The API decides this, so the cancel button matches what will actually work. */
  cancellable: boolean;
  statusHistory: RideStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};