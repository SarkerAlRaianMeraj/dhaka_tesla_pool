"use client";

import { ChevronDown, History } from "lucide-react";
import Link from "next/link";
import { formatPoysha } from "@/lib/format";
import type { Ride } from "@/lib/types";

/**
 * The most recent finished ride, as a compact strip rather than a panel.
 *
 * The design showed a fixed "Farmgate -> Dhanmondi, ৳54" row. This is the
 * passenger's own last ride instead, so the strip is real from the first render.
 * Hidden below 700px, per the design's mobile rules.
 */
export const LastRideStrip = ({ ride }: { ride: Ride | undefined }) => {
  if (!ride) return null;

  return (
    <Link
      href={`/rides/${ride.id}`}
      aria-label={`Last ride: ${ride.pickupZone.name} to ${ride.destinationZone.name}`}
      className="animate-rise flex items-center gap-[13px] rounded-[18px] border border-ink/6 bg-white px-5 py-4 text-forest/50 transition hover:border-mint/40 max-[700px]:hidden"
      style={{ animationDelay: "0.24s" }}
    >
      <History size={17} className="shrink-0" />
      <span className="text-[9px] font-bold tracking-[.1em] uppercase">
        Last ride
      </span>
      <span className="text-xs text-forest">
        {ride.pickupZone.name} &rarr; {ride.destinationZone.name}
      </span>
      <span className="ml-auto text-xs font-semibold text-forest tabular-nums">
        &#2547; {formatPoysha(ride.fareEstimatePoysha)}
      </span>
      <ChevronDown size={15} className="shrink-0" />
    </Link>
  );
};