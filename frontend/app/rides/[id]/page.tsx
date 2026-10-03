"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import {
  formatDistance,
  formatPoysha,
  formatSeats,
  formatTimestamp,
  statusBadgeClass,
} from "@/lib/format";
import type { Ride } from "@/lib/types";

/**
 * One ride, with the fare breakdown and its status history (FR-P4.2, FR-P4.3).
 *
 * The history is rendered as a plain list rather than a progress tracker. Phase 5
 * owns the full tracker with plain-language explanations for every state; this
 * shows the trail as recorded so a passenger can see when a ride was requested and,
 * if it was cancelled, when.
 *
 * The Cancel button's visibility comes from `ride.cancellable`, which the API
 * computes. The browser does not re-derive the rule, so the button can never offer
 * something the server will then refuse.
 */
const RideDetailPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rideId = params.id;
  const { user, isLoading } = useAuth();

  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * Which ride id the current `ride` state belongs to.
   *
   * "Loading" is derived from it rather than stored: navigating from one ride to
   * another reuses this component instance, so a stored `isLoading` flag would go
   * stale and briefly show the previous ride under the new URL. Comparing ids keeps
   * the skeleton showing for exactly as long as the fetch is outstanding, with no
   * state written from inside an effect.
   */
  const [settledRideId, setSettledRideId] = useState<string | null>(null);
  const isLoadingRide = settledRideId !== rideId;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const fetchRide = async (): Promise<void> => {
      try {
        const response = await apiClient.get<Ride>(`/rides/${rideId}`);
        if (!cancelled) {
          setRide(response.data);
          setError(undefined);
        }
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          router.replace("/login");
          return;
        }
        setRide(null);
        setError(getErrorMessage(caught, "Could not load that ride."));
      } finally {
        if (!cancelled) setSettledRideId(rideId);
      }
    };

    void fetchRide();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, rideId, router]);

  const handleCancel = async (): Promise<void> => {
    setIsCancelling(true);
    setError(undefined);
    try {
      const response = await apiClient.post<Ride>(`/rides/${rideId}/cancel`);
      setRide(response.data);
    } catch (caught) {
      // A refusal here is a normal outcome, not a failure: the ride may have
      // started between rendering the button and clicking it. The server's
      // explanation is shown as-is.
      setError(
        getErrorMessage(caught, "Could not cancel that ride."),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-base-content/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout width="narrow">
      {isLoadingRide ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-40 w-full" />
        </div>
      ) : !ride ? (
        <>
          <FormError>{error}</FormError>
          <p className="text-sm text-base-content/70">
            That ride is not available. It may belong to another passenger, or it
            may never have existed &mdash; the API does not say which (NFR-1).
          </p>
          <Link href="/rides" className="btn btn-outline btn-sm">
            Back to your rides
          </Link>
        </>
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {ride.pickupZone.name} &rarr; {ride.destinationZone.name}
              </h1>
              <p className="text-sm text-base-content/60">
                Requested {formatTimestamp(ride.createdAt)}
              </p>
            </div>
            <span className={`badge ${statusBadgeClass(ride.status)}`}>
              {ride.statusLabel}
            </span>
          </header>

          <section className="card bg-base-100 shadow">
            <div className="card-body flex flex-col gap-3">
              <h2 className="card-title text-base">Trip</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-base-content/70">Pickup</dt>
                <dd>{ride.pickupZone.name}</dd>
                <dt className="text-base-content/70">Destination</dt>
                <dd>{ride.destinationZone.name}</dd>
                <dt className="text-base-content/70">Seats</dt>
                <dd>{formatSeats(ride.seatsRequested)}</dd>
                <dt className="text-base-content/70">Distance</dt>
                <dd className="tabular-nums">
                  {formatDistance(ride.distanceKm)} km
                </dd>
              </dl>
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body flex flex-col gap-2">
              <h2 className="card-title text-base">Fare breakdown</h2>
              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-base-content/70">Base fare</dt>
                  <dd className="tabular-nums">
                    {formatPoysha(ride.baseFarePoysha)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-base-content/70">
                    Distance charge ({formatDistance(ride.distanceKm)} km)
                  </dt>
                  <dd className="tabular-nums">
                    {formatPoysha(ride.distanceChargePoysha)}
                  </dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt>Estimated fare</dt>
                  <dd className="tabular-nums">
                    {formatPoysha(ride.fareEstimatePoysha)} Taka
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-base-content/60">
                A 20% sharing discount applies to the distance charge if your trip
                starts with other passengers.
              </p>
            </div>
          </section>

          <section className="card bg-base-100 shadow">
            <div className="card-body flex flex-col gap-2">
              <h2 className="card-title text-base">Status history</h2>
              {/*
                Recorded as it happened rather than derived from the current
                status, so the entries cannot disagree with each other.
              */}
              <ol className="flex flex-col gap-2">
                {ride.statusHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                    />
                    {/*
                      Each entry is described with its own label and timestamp.
                      Using the ride's current label here would relabel an old
                      entry every time the status changed.
                    */}
                    <span>
                      {entry.statusLabel} &middot;{" "}
                      <span className="text-base-content/60">
                        {formatTimestamp(entry.changedAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              {ride.status === "CANCELLED" ? (
                <p className="text-xs text-base-content/60">
                  This ride was cancelled. The entries above are the record of it.
                </p>
              ) : null}
            </div>
          </section>

          <FormError>{error}</FormError>

          {ride.cancellable ? (
            <button
              type="button"
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              className="btn btn-outline btn-error"
            >
              {isCancelling ? "Cancelling..." : "Cancel this ride"}
            </button>
          ) : (
            <p className="text-xs text-base-content/60">
              This ride can no longer be cancelled.
            </p>
          )}

          <Link href="/rides" className="link text-sm">
            Back to your rides
          </Link>
        </>
      )}
    </Layout>
  );
};

export default RideDetailPage;