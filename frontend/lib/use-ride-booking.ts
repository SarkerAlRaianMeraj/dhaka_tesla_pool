"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { firstIssue, rideRequestSchema } from "@/lib/schemas";
import type { Ride, RideQuote, Zone } from "@/lib/types";

/** Tesla capacity is 1-3 seats, so these are the only seat counts the API accepts. */
export const SEAT_OPTIONS = [1, 2, 3] as const;

/**
 * Owns everything the booking panel needs to be a real booking form: the zone
 * list, a live fare quote, and the request itself.
 *
 * The fare is fetched from `POST /rides/quote` and never recalculated in the
 * browser. That is the point of the panel: the number shown has to be the number
 * the server will charge. A second implementation of the fare rule in TypeScript
 * would eventually disagree with `fare.ts` by one paisa and be believed - so the
 * design's browser-side fare formula was dropped rather than ported.
 *
 * Quotes are refired on every selection change, so each is stamped with the
 * selection it was priced for. Freshness is then derived by comparison instead of
 * cleared imperatively: changing either zone makes the previous quote stale, which
 * puts the skeleton back while the new one is in flight. That removes the
 * stale-response race, where a slow earlier quote can no longer be shown because
 * its key no longer matches.
 */
export const useRideBooking = (onUnauthorized: () => void) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesError, setZonesError] = useState<string | undefined>(undefined);

  /*
   * The selected codes are overrides, not the source of truth for what is selected.
   *
   * The design opened on Banani -> Gulshan, and those are real seeded zones, so the
   * same default applies as soon as the list arrives. Deriving the default during
   * render rather than writing it into state from an effect avoids the cascading
   * render that a setState-in-effect causes, and it means the defaults are
   * recomputed if the zone list ever changes instead of going stale.
   */
  const [pickupOverride, setPickupOverride] = useState("");
  const [destinationOverride, setDestinationOverride] = useState("");
  const [seatsRequested, setSeatsRequested] = useState(1);

  const defaults = useMemo(() => {
    const pickup = zones.find((zone) => zone.name.startsWith("Banani")) ?? zones[0];
    const destination =
      zones.find(
        (zone) => zone.name.startsWith("Gulshan") && zone.code !== pickup?.code,
      ) ?? zones.find((zone) => zone.code !== pickup?.code);
    return { pickup: pickup?.code ?? "", destination: destination?.code ?? "" };
  }, [zones]);

  const pickupZoneCode = pickupOverride || defaults.pickup;
  const destinationZoneCode = destinationOverride || defaults.destination;

  const [quote, setQuote] = useState<{ key: string; data: RideQuote } | null>(null);
  const [quoteError, setQuoteError] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const canQuote = pickupZoneCode !== "" && destinationZoneCode !== "";
  const selectionKey = canQuote
    ? `${pickupZoneCode}|${destinationZoneCode}`
    : null;
  const currentQuote = quote?.key === selectionKey ? quote.data : null;
  const currentQuoteError =
    quoteError?.key === selectionKey ? quoteError.message : null;
  const isQuoting = selectionKey !== null && !currentQuote && !currentQuoteError;

  useEffect(() => {
    let cancelled = false;

    const fetchZones = async (): Promise<void> => {
      try {
        const response = await apiClient.get<Zone[]>("/zones");
        if (cancelled) return;
        setZones(response.data);
        setZonesError(undefined);
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          onUnauthorized();
          return;
        }
        setZonesError(getErrorMessage(caught, "Could not load the zone list."));
      }
    };

    void fetchZones();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  useEffect(() => {
    if (selectionKey === null) return;

    let cancelled = false;

    const fetchQuote = async (): Promise<void> => {
      try {
        const response = await apiClient.post<RideQuote>("/rides/quote", {
          pickupZoneCode,
          destinationZoneCode,
        });
        if (cancelled) return;
        setQuote({ key: selectionKey, data: response.data });
        setQuoteError(null);
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

  const swapRoute = useCallback(() => {
    setPickupOverride(destinationZoneCode);
    setDestinationOverride(pickupZoneCode);
  }, [pickupZoneCode, destinationZoneCode]);

  const adjustSeats = useCallback((delta: number) => {
    setSeatsRequested((current) => Math.min(3, Math.max(1, current + delta)));
  }, []);

  /** Validates with Zod, posts the request, and hands the created ride back. */
  const submit = useCallback(async (): Promise<Ride | null> => {
    const result = rideRequestSchema.safeParse({
      pickupZoneCode,
      destinationZoneCode,
      seatsRequested,
    });
    if (!result.success) {
      setError(firstIssue(result.error));
      return null;
    }

    setError(undefined);
    setPending(true);
    try {
      const response = await apiClient.post<Ride>("/rides", result.data);
      return response.data;
    } catch (caught) {
      if (isUnauthorized(caught)) {
        onUnauthorized();
        return null;
      }
      setError(
        getErrorMessage(
          caught,
          "Could not reach the API. Is the backend running on port 3000?",
        ),
      );
      return null;
    } finally {
      setPending(false);
    }
  }, [pickupZoneCode, destinationZoneCode, seatsRequested, onUnauthorized]);

  return {
    zones,
    zonesError,
    pickupZoneCode,
    destinationZoneCode,
    seatsRequested,
    setPickupZoneCode: setPickupOverride,
    setDestinationZoneCode: setDestinationOverride,
    swapRoute,
    adjustSeats,
    canQuote,
    isQuoting,
    currentQuote,
    currentQuoteError,
    error,
    pending,
    submit,
  };
};