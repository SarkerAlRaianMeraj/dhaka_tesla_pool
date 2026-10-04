"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError, Select } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { PrimaryAction } from "@/components/ui/button";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { formatDistance, formatPoysha, formatSeats } from "@/lib/format";
import { firstIssue, rideRequestSchema } from "@/lib/schemas";
import type { Ride, RideQuote, Zone } from "@/lib/types";

const SEAT_OPTIONS = [1, 2, 3];

/**
 * Request a ride, with the fare shown before anything is committed (FR-P2.1,
 * FR-P2.2).
 *
 * The quote is fetched from `POST /rides/quote` rather than calculated in the
 * browser. That is the whole point of the screen: the number shown has to be the
 * number the server will charge, and a second implementation of the fare rule in
 * TypeScript would eventually disagree with the one in `fare.ts` by one paisa and
 * be believed.
 */
const RequestRidePage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [pickupZoneCode, setPickupZoneCode] = useState("");
  const [destinationZoneCode, setDestinationZoneCode] = useState("");
  const [seatsRequested, setSeatsRequested] = useState(1);

  const [quote, setQuote] = useState<{ key: string; data: RideQuote } | null>(
    null,
  );
  const [quoteError, setQuoteError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [zonesError, setZonesError] = useState<string | undefined>(undefined);

  const canQuote = pickupZoneCode !== "" && destinationZoneCode !== "";
  /**
   * Quotes are refired on every select change, so each one is stamped with the
   * selection it was priced for.
   *
   * Freshness is then derived by comparison instead of cleared imperatively: any
   * change to either zone makes the previous quote "stale", which puts the skeleton
   * back up while the new one is in flight. That removes both the stale-response
   * race - a slow earlier quote can no longer be shown, because its key no longer
   * matches - and the need to reset state from inside the effect.
   */
  const selectionKey = canQuote
    ? `${pickupZoneCode}|${destinationZoneCode}`
    : null;
  const currentQuote = quote?.key === selectionKey ? quote.data : null;
  const currentQuoteError =
    quoteError?.key === selectionKey ? quoteError.message : null;
  const isQuoting = selectionKey !== null && !currentQuote && !currentQuoteError;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const fetchZones = async (): Promise<void> => {
      try {
        const response = await apiClient.get<Zone[]>("/zones");
        if (!cancelled) setZones(response.data);
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          router.replace("/login");
          return;
        }
        setZonesError(getErrorMessage(caught, "Could not load the zone list."));
      }
    };

    void fetchZones();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

  useEffect(() => {
    if (selectionKey === null) return;

    let cancelled = false;

    const fetchQuote = async (): Promise<void> => {
      try {
        const response = await apiClient.post<RideQuote>("/rides/quote", {
          pickupZoneCode,
          destinationZoneCode,
        });
        if (!cancelled) setQuote({ key: selectionKey, data: response.data });
      } catch (caught) {
        if (cancelled) return;
        setQuoteError({
          key: selectionKey,
          message: getErrorMessage(
            caught,
            "Could not work out the fare for that trip.",
          ),
        });
      }
    };

    void fetchQuote();
    return () => {
      cancelled = true;
    };
  }, [selectionKey, pickupZoneCode, destinationZoneCode]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const result = rideRequestSchema.safeParse({
      pickupZoneCode,
      destinationZoneCode,
      seatsRequested,
    });
    if (!result.success) {
      setError(firstIssue(result.error));
      return;
    }

    setError(undefined);
    setPending(true);
    try {
      const response = await apiClient.post<Ride>("/rides", result.data);
      router.push(`/rides/${response.data.id}`);
    } catch (caught) {
      setError(
        getErrorMessage(
          caught,
          "Could not reach the API. Is the backend running on port 3000?",
        ),
      );
    } finally {
      setPending(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-ink/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout width="narrow">
      <div className="flex flex-col gap-1">
        <Eyebrow>New request</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Request a ride
        </h1>
        <p className="text-sm text-ink/60">
          Choose your route and see the exact fare before you commit.
        </p>
      </div>

      <FormError>{zonesError}</FormError>

      <Panel as="section" className="animate-rise">
        <form className="flex flex-col gap-5 px-7 py-8" onSubmit={handleSubmit}>
          <Select
            label="Pickup"
            name="pickupZoneCode"
            value={pickupZoneCode}
            onChange={(event) => setPickupZoneCode(event.target.value)}
          >
            <option value="">Choose a pickup zone</option>
            {zones.map((zone) => (
              <option key={zone.code} value={zone.code}>
                {zone.name}
              </option>
            ))}
          </Select>

          <Select
            label="Destination"
            name="destinationZoneCode"
            value={destinationZoneCode}
            onChange={(event) => setDestinationZoneCode(event.target.value)}
          >
            <option value="">Choose a destination</option>
            {zones.map((zone) => (
              <option key={zone.code} value={zone.code}>
                {zone.name}
              </option>
            ))}
          </Select>

          {/*
            A three-way choice is a segmented control, not a dropdown and not a row of
            plus/minus buttons. A stepper would mean two clicks and an aria-live
            announcement to say "1 seat", for a domain that only has three valid
            values - `aria-pressed` on a group of buttons says the same thing with
            one click.
          */}
          <fieldset className="flex flex-col gap-2">
            <legend className="font-display text-sm font-semibold text-forest">
              Seats
            </legend>
            <div className="flex gap-2">
              {SEAT_OPTIONS.map((seats) => {
                const selected = seatsRequested === seats;
                return (
                  <button
                    key={seats}
                    type="button"
                    onClick={() => setSeatsRequested(seats)}
                    aria-pressed={selected}
                    className={`min-h-[44px] flex-1 rounded-2xl border font-display text-sm font-semibold transition ${
                      selected
                        ? "border-mint bg-mint/25 text-forest"
                        : "border-ink/10 bg-white text-forest/65 hover:border-forest/30 hover:text-forest"
                    }`}
                  >
                    {seats}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink/55">
              {formatSeats(seatsRequested)} requested. Cars are pooled, so other
              passengers may share the trip.
            </p>
          </fieldset>

          {/*
            The fare breakdown, shown as separate lines because the brief asks for a
            passenger to be able to check the arithmetic by hand (FR-F1).

            It is a bordered block rather than a nested Panel on purpose - spec 8 says
            internal areas of a panel are unframed rows, and a shadow inside a shadow
            reads as a card inside a card.
          */}
          <section
            aria-live="polite"
            className="rounded-2xl border border-ink/8 bg-white p-5"
          >
            <h2 className="font-display text-sm font-semibold text-forest">
              Fare estimate
            </h2>
            {!canQuote ? (
              <p className="mt-2 text-sm text-ink/55">
                Choose a pickup and a destination to see the fare.
              </p>
            ) : isQuoting ? (
              <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-4 w-2/3" label="Pricing your trip" />
                <Skeleton className="h-4 w-1/2" label="Pricing your trip" />
              </div>
            ) : currentQuoteError ? (
              <p className="mt-2 text-sm font-medium text-destructive">
                {currentQuoteError}
              </p>
            ) : currentQuote ? (
              <>
                <dl className="mt-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink/60">Base fare</dt>
                    <dd className="tabular-nums text-ink">
                      {formatPoysha(currentQuote.baseFarePoysha)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/60">
                      Distance charge ({formatDistance(currentQuote.distanceKm)} km)
                    </dt>
                    <dd className="tabular-nums text-ink">
                      {formatPoysha(currentQuote.distanceChargePoysha)}
                    </dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-ink/8 pt-3 font-semibold">
                    <dt className="font-display text-ink">Estimated fare</dt>
                    <dd className="tabular-nums font-display text-ink">
                      {formatPoysha(currentQuote.fareEstimatePoysha)} Taka
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink/55">
                  A 20% sharing discount applies to the distance charge once your
                  trip starts with other passengers. You pay this estimate or less.
                </p>
              </>
            ) : null}
          </section>

          <FormError>{error}</FormError>

          <PrimaryAction type="submit" disabled={pending || !canQuote}>
            {pending ? "Requesting..." : "Confirm request"}
          </PrimaryAction>
        </form>
      </Panel>

      <p className="text-sm text-ink/60">
        <Link
          className="font-semibold text-forest underline decoration-mint decoration-2 underline-offset-4 hover:decoration-forest"
          href="/rides"
        >
          Your rides
        </Link>
      </p>
    </Layout>
  );
};

export default RequestRidePage;