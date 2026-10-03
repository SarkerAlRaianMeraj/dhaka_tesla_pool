import type { RideStatus } from "./types";

/**
 * Formats integer poysha for display: 34560 becomes "345.60".
 *
 * The value is already whole poysha and stays whole through the division - no
 * rounding happens here, because a fare that is off by one paisa in the last place
 * is a bug that reads as a pricing bug (FR-F2). The trailing digits come from
 * splitting the integer, not from a float.
 */
export const formatPoysha = (poysha: number): string => {
  const negative = poysha < 0;
  const absolute = Math.abs(Math.trunc(poysha));
  const taka = Math.floor(absolute / 100);
  const paisa = absolute % 100;

  return `${negative ? "-" : ""}${taka.toLocaleString("en-US")}.${String(paisa).padStart(2, "0")}`;
};

/** `3.8` rather than `3.8000000000000004`, without lying about a whole number. */
export const formatDistance = (distanceKm: number): string =>
  Number.isInteger(distanceKm) ? String(distanceKm) : distanceKm.toFixed(1);

/** "2 seats" / "1 seat", because "1 seats" is the kind of detail a viva finds. */
export const formatSeats = (seats: number): string =>
  `${seats} ${seats === 1 ? "seat" : "seats"}`;

/** ISO timestamp to something a person can read, without pulling in a date library. */
export const formatTimestamp = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Badge class per status, so the same ride looks the same on the list and the
 * detail page.
 *
 * daisyUI has no "warning" style that reads well on every theme, so the mapping is
 * explicit and small rather than derived from the status name - deriving it would
 * silently produce `badge-REQUESTED` for a status nobody defined a colour for.
 */
export const statusBadgeClass = (status: RideStatus): string => {
  switch (status) {
    case "REQUESTED":
      return "badge-info";
    case "MATCHED":
    case "ACCEPTED":
    case "DRIVER_ARRIVED":
      return "badge-primary";
    case "STARTED":
      return "badge-success";
    case "COMPLETED":
      return "badge-ghost";
    case "CANCELLED":
      return "badge-error badge-outline";
  }
};