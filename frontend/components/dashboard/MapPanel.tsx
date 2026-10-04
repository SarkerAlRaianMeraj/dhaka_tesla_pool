"use client";

import { CarFront, Clock3, Navigation } from "lucide-react";
import { formatDistance, formatPoysha } from "@/lib/format";
import type { RideQuote, Zone } from "@/lib/types";

/**
 * The route intelligence panel: an illustrative map, plus real trip statistics.
 *
 * The map is a designed simulation, not a map. There is no geospatial data in this
 * product - no driver locations, no telemetry, no routing engine - so the grid,
 * roads, radar sweep, moving Tesla and nearby vehicles are CSS and SVG drawing a
 * *shape of idea*, and the panel says so in its own copy rather than letting a
 * decorative animation pass as live tracking. The design's own support line called
 * it "Simulated live fleet activity", and that wording is kept.
 *
 * What is real: the route drawn is the route being priced, the pickup and
 * drop-off markers carry the two real zone names, and the three statistics are the
 * server's distance, seat count and fare. The design's "4 Teslas nearby", "92%
 * charge", a named driver and a 4-minute ETA had no data source at all and were
 * replaced rather than faked - `Ride` carries no driver until Phase 4 assigns one.
 */

const ROAD_PATHS = [
  "M-20 410 C130 385 145 245 290 255 S480 370 830 65",
  "M85 -20 C115 105 230 112 255 235 S180 420 300 530",
  "M480 -20 C425 120 515 190 650 205 S760 320 830 350",
];

const ROUTE_PATH = "M92 390 C185 360 195 278 295 260 S520 310 690 105";

/** The three nearby vehicles, positioned and labelled by the design. */
const NEARBY = [
  { left: "34%", top: "30%", eta: "3 min" },
  { left: "60%", top: "60%", eta: null },
  { left: "20%", top: "47%", eta: null },
];

type MapPanelProps = {
  pickup: Zone | undefined;
  destination: Zone | undefined;
  /** `null` until the server prices the current route - see `useRideBooking`. */
  quote: RideQuote | null;
  seatsRequested: number;
  hasActiveRide: boolean;
};

export const MapPanel = ({
  pickup,
  destination,
  quote,
  seatsRequested,
  hasActiveRide,
}: MapPanelProps) => (
  <section
    aria-labelledby="map-heading"
    className="animate-rise flex min-w-0 flex-col gap-[21px] rounded-[26px] border border-ink/6 bg-white p-7 shadow-[0_20px_48px_color-mix(in_oklab,var(--color-ink)_5%,transparent)] max-[1050px]:min-h-[670px]"
    style={{ animationDelay: "0.16s" }}
  >
    <div className="flex flex-col gap-5 max-[700px]:flex-col">
      <div className="flex-1">
        <p className="text-[10px] font-bold tracking-[.18em] text-forest/55 uppercase">
          Route intelligence
        </p>
        <h2
          id="map-heading"
          className="mt-1 font-display text-[24px] font-semibold text-ink"
        >
          {pickup?.name ?? "Pickup"}{" "}
          <span className="text-mint" aria-hidden>
            &rarr;
          </span>{" "}
          <span className="sr-only">to</span>
          {destination?.name ?? "drop-off"}
        </h2>
        <p className="mt-1 text-xs text-forest/48">
          Simulated route activity across Dhaka &mdash; illustrative, not live
          tracking
        </p>
      </div>

      <div className="flex gap-[15px] pt-1.5">
        {[
          { label: "Your Tesla", className: "bg-mint shadow-[0_0_9px_var(--color-mint)]" },
          { label: "Nearby", className: "bg-forest/25" },
        ].map((entry) => (
          <span
            key={entry.label}
            className="flex items-center gap-1.5 text-[9px] font-bold tracking-[.06em] whitespace-nowrap text-forest/47 uppercase"
          >
            <span aria-hidden className={`size-2 rounded-full ${entry.className}`} />
            {entry.label}
          </span>
        ))}
      </div>
    </div>

    <div className="relative min-h-[480px] flex-1 overflow-hidden rounded-[21px] bg-forest shadow-[inset_0_0_80px_color-mix(in_oklab,var(--color-ink)_45%,transparent)] max-[700px]:min-h-[390px]">
      {/* Grid texture: two perpendicular 1px mint gradients on a 55px cell. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-12"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--color-mint) 30%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-mint) 30%, transparent) 1px, transparent 1px)",
          backgroundSize: "55px 55px",
        }}
      />

      {/* Radar sweep. Only the transform animates; see the keyframes in globals.css. */}
      <div
        aria-hidden
        className="absolute inset-y-0 -left-1/2 w-[45%] animate-radar"
        style={{
          backgroundImage:
            "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-mint) 12%, transparent), transparent)",
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {ROAD_PATHS.map((d, index) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="color-mix(in oklab, var(--color-paper) 9%, transparent)"
            strokeWidth={index === 0 ? 9 : 4}
            strokeOpacity={index === 0 ? 0.6 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="var(--color-mint)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="9 10"
          vectorEffect="non-scaling-stroke"
          style={{
            filter: "drop-shadow(0 0 5px color-mix(in oklab, var(--color-mint) 65%, transparent))",
            animation: "route-dash 1.3s linear infinite",
          }}
        />
      </svg>

      {/* Pickup and drop-off markers, labelled with the real zone names. */}
      <div className="absolute top-[70%] left-[8%] flex flex-col items-center gap-[7px]">
        <span className="rounded-[6px] border border-paper/12 bg-ink/65 px-2 py-[5px] text-[8px] font-extrabold tracking-[.1em] text-mint uppercase backdrop-blur-[7px]">
          {pickup?.name ?? "Pickup"}
        </span>
        <span
          aria-hidden
          className="size-[9px] rounded-full border-2 border-paper shadow-[0_0_12px_color-mix(in_oklab,var(--color-paper)_60%,transparent)]"
        />
      </div>
      <div className="absolute top-[12%] right-[8%] flex flex-col items-center gap-[7px]">
        <span className="rounded-[6px] border border-paper/12 bg-ink/65 px-2 py-[5px] text-[8px] font-extrabold tracking-[.1em] text-mint uppercase backdrop-blur-[7px]">
          {destination?.name ?? "Drop-off"}
        </span>
        <span
          aria-hidden
          className="size-[9px] rounded-full border-2 border-paper shadow-[0_0_12px_color-mix(in_oklab,var(--color-paper)_60%,transparent)]"
        />
      </div>

      {/* The moving Tesla. Decorative: nothing is actually being tracked. */}
      <span
        aria-hidden
        className="animate-drive absolute z-30 grid size-[31px] place-items-center rounded-full border border-paper/55 bg-mint text-ink shadow-[0_0_0_8px_color-mix(in_oklab,var(--color-mint)_13%,transparent),0_0_28px_color-mix(in_oklab,var(--color-mint)_60%,transparent)]"
      >
        <CarFront size={15} />
      </span>

      {NEARBY.map((vehicle) => (
        <span
          key={vehicle.left}
          aria-hidden
          className="group absolute grid size-[25px] -translate-x-1/2 place-items-center rounded-full border border-paper/12 bg-ink/45 text-paper/65 transition duration-200 hover:scale-120 hover:bg-mint hover:text-ink"
          style={{ left: vehicle.left, top: vehicle.top }}
        >
          <CarFront size={13} />
          {vehicle.eta ? (
            <span className="absolute top-[29px] text-[8px] whitespace-nowrap text-paper">
              {vehicle.eta}
            </span>
          ) : null}
        </span>
      ))}

      <div className="absolute bottom-5 left-5 flex items-center gap-[11px] rounded-[12px] border border-paper/12 bg-ink/66 px-[13px] py-2.5 backdrop-blur-[10px]">
        <span aria-hidden className="size-2 animate-ping-soft rounded-full bg-mint" />
        <span className="text-[8px] font-bold tracking-[.1em] text-paper/42 uppercase">
          Live status
        </span>
        <span className="text-[11px] text-paper">
          {hasActiveRide
            ? "Your request is open"
            : "Ready when you are"}
        </span>
      </div>
    </div>

    {/*
        Three real statistics, replacing the design's fleet count, average wait and
        vehicle charge - none of which this product can know. The charge tile is the
        Tesla's absence, stated rather than filled in.
    */}
    <div className="flex items-center justify-center gap-7 max-[700px]:gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="grid size-[37px] place-items-center rounded-[12px] bg-mint/13 text-forest">
          <Navigation size={17} />
        </span>
        <div>
          <p className="font-display text-sm text-forest">
            {quote ? formatDistance(quote.distanceKm) : "—"}
          </p>
          <p className="text-[9px] text-forest/48">Trip distance</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="grid size-[37px] place-items-center rounded-[12px] bg-forest/6 text-forest/50">
          <Clock3 size={17} />
        </span>
        <div>
          <p className="font-display text-sm text-forest">{seatsRequested}</p>
          <p className="text-[9px] text-forest/48">
            {seatsRequested === 1 ? "Seat" : "Seats"} requested
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 max-[700px]:hidden">
        <span className="grid size-[37px] place-items-center rounded-[12px] bg-forest/6 text-forest/50">
          <CarFront size={17} />
        </span>
        <div>
          <p className="font-display text-sm text-forest">
            {quote ? `৳${formatPoysha(quote.fareEstimatePoysha)}` : "—"}
          </p>
          <p className="text-[9px] text-forest/48">Estimated fare</p>
        </div>
      </div>
    </div>
  </section>
);