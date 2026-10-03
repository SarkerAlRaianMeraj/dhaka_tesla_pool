/**
 * The fare rule, exactly as published in `PRD_Dhaka_Tesla_Pool.md` §6.2.
 *
 * ```
 * distanceKm     = |x1 - x2| + |y1 - y2|      Manhattan distance on the zone grid
 * distanceCharge = 1500 poysha x distanceKm
 * passengerFare  = 30000 + distanceCharge - poolDiscount
 * poolDiscount   = 20% of distanceCharge when the Tesla carries >= 2 passengers
 * ```
 *
 * Two properties of this file matter more than its size.
 *
 * **It is pure.** No database, no clock, no configuration. The fare a passenger is
 * shown must be explainable by hand from published numbers (FR-F1, NFR-6), and that
 * is only true if the rule cannot quietly depend on anything else.
 *
 * **It never leaves a fraction.** Money is integer poysha (FR-F2). Three specific
 * things go wrong otherwise, measured rather than assumed:
 *
 * 1. `1500 * distanceKm` is not guaranteed to be whole. For the published
 *    one-decimal zone grid it always is, but `1500 * (1/7)` is `214.28571428571428`,
 *    so the charge is rounded once here and nowhere else. Rounding later would mean
 *    the discount came out of a number nobody sees on the screen.
 * 2. `0.2 * distanceCharge` is not exact either: `0.2 * 214` is `42.800000000000004`.
 *    The discount is taken by integer division instead. `20%` is exactly `1/5`, which
 *    is why a divisor is used rather than a percentage constant.
 * 3. The discount belongs on the *distance charge only*. Applying it to the total
 *    gives `35700 * 0.8 = 28560` for Nusrat's trip, which is 6000 poysha below the
 *    published 34560. This is not an edge case - it is wrong for every possible
 *    fare.
 *
 * `Math.floor` in the discount is a deliberate choice, not an accident. When the
 * distance charge is not divisible by 5 the PRD does not say which way to round, and
 * `Math.floor` and `Math.round` genuinely disagree (`3 / 5` floors to 0, rounds to 1).
 * Flooring removes the discount without ever overcharging, and stays verifiable by
 * hand. Recorded as D23.
 */

/** 1 Taka = 100 poysha. The whole fare is 300 Taka before any distance. */
export const BASE_FARE_POYSHA = 30_000;

/** 15 Taka per kilometre, in poysha. */
export const DISTANCE_CHARGE_PER_KM_POYSHA = 1_500;

/**
 * The sharing discount is 20%, expressed as the divisor that produces it.
 *
 * A 20% discount means paying 4/5, so the amount saved is 1/5 of the distance
 * charge. Integer division keeps the result whole without a rounding rule that
 * would have to be explained separately.
 */
export const POOL_DISCOUNT_DIVISOR = 5;

/** A point on the published Dhaka zone grid, in whole kilometres. */
export type ZonePoint = {
  xKm: number;
  yKm: number;
};

/** Every intermediate value of one fare, so a reviewer can check the arithmetic. */
export type FareBreakdown = {
  distanceKm: number;
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  totalPoysha: number;
};

/**
 * Manhattan distance on the zone grid.
 *
 * Not road distance and not crow-flies-within-a-grid: the brief forbids map APIs,
 * so the grid coordinates *are* the geography (assumption A5). The result is a
 * decimal such as 3.8, which is why `estimateFare` rounds the charge rather than
 * the distance.
 */
export const manhattanDistanceKm = (from: ZonePoint, to: ZonePoint): number =>
  Math.abs(from.xKm - to.xKm) + Math.abs(from.yKm - to.yKm);

/**
 * The distance charge in whole poysha.
 *
 * Rounded here, once, and nowhere else. Rounding later would mean the discount was
 * taken from a value nobody can see on the screen.
 */
export const distanceChargePoysha = (distanceKm: number): number =>
  Math.round(DISTANCE_CHARGE_PER_KM_POYSHA * distanceKm);

/**
 * The sharing discount in whole poysha, taken on the distance charge only.
 *
 * Zero for a solo ride, because occupancy is not knowable at request time: a
 * request is estimated before any Tesla exists, and the discount is applied once
 * at `STARTED` when occupancy is final (PRD §6.2).
 *
 * `Math.floor`, not `Math.round` - see the note at the top of this file and D23.
 */
export const poolDiscountPoysha = (
  distanceCharge: number,
  pooled: boolean,
): number => (pooled ? Math.floor(distanceCharge / POOL_DISCOUNT_DIVISOR) : 0);

/**
 * The full fare, with every intermediate value returned.
 *
 * The breakdown is returned rather than only the total because the screen shows
 * the base, the distance charge, and the estimate as separate lines (wireframe
 * P2), and because a passenger disputing a fare needs the arithmetic, not just
 * the answer.
 */
export const estimateFare = (
  distanceKm: number,
  pooled = false,
): FareBreakdown => {
  const charge = distanceChargePoysha(distanceKm);
  const discount = poolDiscountPoysha(charge, pooled);

  return {
    distanceKm,
    baseFarePoysha: BASE_FARE_POYSHA,
    distanceChargePoysha: charge,
    poolDiscountPoysha: discount,
    totalPoysha: BASE_FARE_POYSHA + charge - discount,
  };
};
