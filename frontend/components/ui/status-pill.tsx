import { statusBadgeClass } from "@/lib/format";
import type { RideStatus } from "@/lib/types";

/**
 * The status badge, in the design's one pill-shaped element.
 *
 * The mapping itself is not here. `statusBadgeClass` in `lib/format.ts` already owns
 * "which colour is this status", and it returns daisyUI classes - which is exactly why
 * the Kinetic theme in `app/globals.css` was the right lever for the redesign: that
 * function did not have to be touched for its colours to change. Re-deriving the
 * mapping in a component would create a second place where a status is coloured, and
 * the two would disagree the first time someone added a lifecycle state.
 *
 * What this component adds is shape and typography: spec §8 allows a small status badge
 * to be fully pill-shaped, and the design sets the label at 10px bold with `.12em`
 * tracking. daisyUI's default badge is larger and rounder than the design intends.
 */
export const StatusPill = ({
  status,
  label,
  className = "",
}: {
  status: RideStatus;
  /** Overrides the derived label, for the pages that want prose over a status name. */
  label?: string;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[.12em] uppercase ${statusBadgeClass(status)} ${className}`.trim()}
  >
    {label ?? status}
  </span>
);