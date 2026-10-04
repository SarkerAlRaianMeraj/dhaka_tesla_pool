"use client";

import {
  ArrowDownUp,
  CarFront,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
} from "lucide-react";
import { formatDistance, formatPoysha } from "@/lib/format";
import type { useRideBooking } from "@/lib/use-ride-booking";
import type { Zone } from "@/lib/types";

type Booking = ReturnType<typeof useRideBooking>;

type BookingPanelProps = {
  booking: Booking;
  /**
   * Creates the ride. The panel does not navigate: the page owns what happens next
   * so that "request a ride" and any other future trigger share one path.
   */
  onRequest: () => void;
};

/**
 * "Plan your route": pickup, destination, seats, the fare, and the request button.
 *
 * Everything shown is real. The fare is whatever `POST /rides/quote` last
 * answered for the current pair of zones; the eight locations are the seeded
 * Dhaka zones from `GET /zones`, not a hardcoded list.
 *
 * The fare does not change with the seat count, because a pooled trip is priced
 * per journey rather than per seat - the panel says so rather than letting the
 * number look stale.
 */
export const BookingPanel = ({ booking, onRequest }: BookingPanelProps) => {
  const {
    zones,
    zonesError,
    pickupZoneCode,
    destinationZoneCode,
    seatsRequested,
    setPickupZoneCode,
    setDestinationZoneCode,
    swapRoute,
    adjustSeats,
    canQuote,
    isQuoting,
    currentQuote,
    currentQuoteError,
    error,
    pending,
  } = booking;

  const locationOptions = (
    selected: string,
    onSelect: (code: string) => void,
    exclude: string,
  ) => (
    <select
      value={selected}
      onChange={(event) => onSelect(event.target.value)}
      className="w-full appearance-none border-0 bg-transparent text-[14px] font-semibold text-forest outline-none"
    >
      {zones.map((zone: Zone) => (
        <option
          key={zone.code}
          value={zone.code}
          // The API refuses a same-zone trip, so the option is removed from the
          // other selector rather than left to fail on submit.
          disabled={zone.code === exclude}
        >
          {zone.name}
        </option>
      ))}
    </select>
  );

  return (
    <section
      aria-labelledby="booking-heading"
      className="animate-rise rounded-[26px] border border-ink/6 bg-white p-[27px] shadow-[0_20px_48px_color-mix(in_oklab,var(--color-ink)_5%,transparent)]"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[.18em] text-forest/55 uppercase">
            Plan your route
          </p>
          <h2
            id="booking-heading"
            className="mt-1 font-display text-[21px] font-semibold text-ink"
          >
            Request a pooled ride
          </h2>
        </div>
        <span className="inline-flex items-center gap-[7px] rounded-full border border-mint/24 bg-mint/10 px-2.5 py-1.5 text-[10px] font-bold text-forest uppercase">
          <span className="size-1.5 animate-ping-soft rounded-full bg-mint" />
          Live
        </span>
      </div>

      {zonesError ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {zonesError}
        </p>
      ) : null}

      <div className="relative flex flex-col gap-2.5">
        <div className="flex min-h-[60px] items-center gap-[13px] rounded-[17px] border border-ink/7 bg-paper/75 px-[14px] py-2 transition duration-200 hover:border-mint/45 hover:bg-paper hover:translate-x-0.5 focus-within:border-mint/45 focus-within:bg-paper">
          <span
            aria-hidden
            className="size-[9px] shrink-0 rounded-full bg-mint shadow-[0_0_12px_color-mix(in_oklab,var(--color-mint)_70%,transparent)]"
          />
          <span className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[.1em] text-forest/47 uppercase">
              Pickup
            </span>
            {locationOptions(pickupZoneCode, setPickupZoneCode, destinationZoneCode)}
          </span>
          <LocateFixed size={17} className="ml-auto shrink-0 text-forest/45" />
        </div>

        <button
          type="button"
          onClick={swapRoute}
          aria-label="Swap pickup and destination"
          title="Swap route"
          className="absolute right-[46px] top-[53px] z-20 grid size-7 place-items-center rounded-[9px] border-[3px] border-white bg-forest text-paper transition duration-300 hover:rotate-180"
        >
          <ArrowDownUp size={16} />
        </button>

        <div className="flex min-h-[60px] items-center gap-[13px] rounded-[17px] border border-ink/7 bg-paper/75 px-[14px] py-2 transition duration-200 hover:border-mint/45 hover:bg-paper hover:translate-x-0.5 focus-within:border-mint/45 focus-within:bg-paper">
          <span
            aria-hidden
            className="size-[9px] shrink-0 rounded-full border-2 border-forest/38"
          />
          <span className="flex flex-col">
            <span className="text-[9px] font-bold tracking-[.1em] text-forest/47 uppercase">
              Drop-off
            </span>
            {locationOptions(
              destinationZoneCode,
              setDestinationZoneCode,
              pickupZoneCode,
            )}
          </span>
          <MapPin size={17} className="ml-auto shrink-0 text-forest/45" />
        </div>
      </div>

      <div className="mt-[25px] flex items-end justify-between gap-5 border-t border-ink/7 pt-5 max-[700px]:mt-5">
        <fieldset className="flex flex-col">
          <legend className="text-[9px] font-bold tracking-[.1em] text-forest/47 uppercase">
            Seats needed
          </legend>
          <div className="mt-[7px] flex items-center gap-[13px]">
            <button
              type="button"
              onClick={() => adjustSeats(-1)}
              disabled={seatsRequested <= 1}
              aria-label="Remove seat"
              className="grid size-[27px] place-items-center rounded-[9px] border border-ink/9 bg-paper font-bold text-forest transition hover:bg-mint/20 disabled:opacity-35"
            >
              <Minus size={13} />
            </button>
            <span className="w-3 text-center text-sm font-bold text-ink tabular-nums">
              {seatsRequested}
            </span>
            <button
              type="button"
              onClick={() => adjustSeats(1)}
              disabled={seatsRequested >= 3}
              aria-label="Add seat"
              className="grid size-[27px] place-items-center rounded-[9px] border border-ink/9 bg-paper font-bold text-forest transition hover:bg-mint/20 disabled:opacity-35"
            >
              <Plus size={13} />
            </button>
          </div>
        </fieldset>

        <div className="text-right">
          <p className="text-[9px] font-bold tracking-[.1em] text-forest/47 uppercase">
            Your pooled fare
          </p>
          <div aria-live="polite" className="mt-0.5">
            {!canQuote ? (
              <p className="text-sm text-forest/45">Choose both ends</p>
            ) : isQuoting ? (
              <div className="mt-1 flex flex-col items-end gap-1">
                <div className="skeleton h-6 w-24" />
              </div>
            ) : currentQuoteError ? (
              <p className="text-sm text-destructive">{currentQuoteError}</p>
            ) : currentQuote ? (
              <p className="font-display text-[34px] leading-none text-ink">
                &#2547;
                {/*
                  The design set the decimals smaller and fainter. Splitting the
                  formatted string keeps that treatment while still showing the
                  server's exact poysha - formatPoysha never rounds.
                */}
                {(() => {
                  const [taka, paisa] = formatPoysha(
                    currentQuote.fareEstimatePoysha,
                  ).split(".");
                  return (
                    <>
                      {taka}
                      <span className="text-[17px] opacity-35">.{paisa}</span>
                    </>
                  );
                })()}
              </p>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-normal text-forest/45">
            Cash or TeslaPay
          </p>
        </div>
      </div>

      {currentQuote ? (
        <p className="mt-3 text-[11px] text-forest/50">
          {formatDistance(currentQuote.distanceKm)} km. One price for the journey,
          not per seat - a 20% sharing discount applies to the distance charge once
          your trip starts with other passengers.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onRequest}
        disabled={pending || !canQuote}
        className="mt-[23px] flex min-h-[50px] w-full items-center justify-center gap-[9px] rounded-[16px] bg-mint text-sm font-bold text-ink shadow-[0_12px_25px_color-mix(in_oklab,var(--color-mint)_30%,transparent)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_color-mix(in_oklab,var(--color-mint)_38%,transparent)] active:scale-[.98] disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="size-4 animate-spin-slow rounded-full border-2 border-forest/22 border-t-forest" />
            Requesting your ride
          </>
        ) : (
          <>
            <CarFront size={19} />
            Request a pooled ride
          </>
        )}
      </button>

      {/*
        The design showed a matched state on this button with a "view arriving
        Tesla" affordance. There is nothing to view yet: nothing assigns a driver to
        a request until Phase 4, so the passenger's next step is still their ride
        detail page.
      */}
    </section>
  );
};