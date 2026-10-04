"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import type { Ride } from "@/lib/types";

/**
 * The signed-in passenger's own rides, newest first.
 *
 * `GET /rides` returns only this passenger's rides (US-P7), so the dashboard can
 * pick an active trip and a last trip from one request instead of asking twice.
 * "Active" means a ride that has not reached a terminal state - `COMPLETED` and
 * `CANCELLED` both end a trip, and a passenger whose only rides are finished should
 * be offered a booking form rather than a progress bar that will never advance.
 */
export const usePassengerRides = (onUnauthorized: () => void) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const fetchRides = async (): Promise<void> => {
      try {
        const response = await apiClient.get<Ride[]>("/rides");
        if (cancelled) return;
        setRides(response.data);
        setError(undefined);
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          onUnauthorized();
          return;
        }
        setError(getErrorMessage(caught, "Could not load your rides."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchRides();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized]);

  const activeRide = rides.find(
    (ride) => ride.status !== "COMPLETED" && ride.status !== "CANCELLED",
  );
  const lastRide = rides.find(
    (ride) => ride.status === "COMPLETED" || ride.status === "CANCELLED",
  );

  return { rides, activeRide, lastRide, isLoading, error };
};