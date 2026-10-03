import { RideStatus } from '../common/enums/ride-status.enum';
import { ZoneView } from '../zone/zone.service';

/**
 * A zone as it appears inside a ride.
 *
 * `ZoneView` minus `corridors`: a ride's zones are loaded through their foreign keys
 * without the corridor join, because no Phase 2 screen shows a ride's corridors.
 * Declaring the narrower type keeps the response honest — shipping `corridors: []`
 * would read as "this ride has no corridors" rather than "this view omits them".
 */
export type RideZoneView = Omit<ZoneView, 'corridors'>;

/**
 * What the API returns for a fare preview.
 *
 * Named `QuoteView` rather than `FareView` because it quotes a fare; it does not
 * create one and nothing is persisted (FR-P2.2, FR-F1).
 *
 * `poolDiscountPoysha` is reported as 0 and `pooled` as false because occupancy is
 * unknowable at request time — the discount is applied once at `STARTED`. Including
 * the field at 0 rather than omitting it keeps the response shape identical to the
 * breakdown shown at `STARTED` later, so one component can render both.
 */
export type QuoteView = {
  distanceKm: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  fareEstimatePoysha: number;
  pooled: boolean;
};

/** One line of a ride's state history. */
export type RideStatusHistoryView = {
  id: string;
  fromStatus: RideStatus | null;
  toStatus: RideStatus;
  statusLabel: string;
  changedAt: Date;
};

/**
 * A ride as the passenger sees it.
 *
 * `distanceKm` and `fareEstimatePoysha` are echoed back on every read, including
 * the detail and list screens, so the breakdown a passenger disputes can be shown
 * from the ride itself rather than recomputed against a fare rule that may since
 * have changed.
 */
export type RideView = {
  id: string;
  passengerId: string;
  pickupZone: RideZoneView;
  destinationZone: RideZoneView;
  seatsRequested: number;
  distanceKm: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  fareEstimatePoysha: number;
  status: RideStatus;
  statusLabel: string;
  cancellable: boolean;
  statusHistory: RideStatusHistoryView[];
  createdAt: Date;
  updatedAt: Date;
};
