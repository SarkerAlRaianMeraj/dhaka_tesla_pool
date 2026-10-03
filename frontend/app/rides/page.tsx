"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
 * The passenger's ride history (FR-P4.1, FR-P5.2).
 *
 * Newest first, which is the only useful order for someone checking whether the
 * ride they just requested is the one at the top. The list is scoped by the API to
 * the caller, so there is no owner filter to get wrong here and no way for this
 * screen to show someone else's ride.
 */
const RidesPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoadingRides, setIsLoadingRides] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const fetchRides = async (): Promise<void> => {
      setIsLoadingRides(true);
      try {
        const response = await apiClient.get<Ride[]>("/rides");
        if (!cancelled) {
          setRides(response.data);
          setError(undefined);
        }
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          router.replace("/login");
          return;
        }
        setError(getErrorMessage(caught, "Could not load your rides."));
      } finally {
        if (!cancelled) setIsLoadingRides(false);
      }
    };

    void fetchRides();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-base-content/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Your rides</h1>
          <p className="text-sm text-base-content/70">
            {rides.length === 0
              ? "Nothing requested yet."
              : `${rides.length} ${rides.length === 1 ? "ride" : "rides"}, most recent first.`}
          </p>
        </div>
        <Link href="/rides/request" className="btn btn-primary btn-sm">
          Request a ride
        </Link>
      </header>

      <FormError>{error}</FormError>

      {isLoadingRides ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-28 w-full" />
          <div className="skeleton h-28 w-full" />
        </div>
      ) : rides.length === 0 ? (
        <section className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">No rides yet</h2>
            <p className="text-sm text-base-content/70">
              Request a ride and it will appear here with its fare and status.
            </p>
            <div className="card-actions">
              <Link href="/rides/request" className="btn btn-primary btn-sm">
                Request your first ride
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {rides.map((ride) => (
            <li key={ride.id}>
              <Link
                href={`/rides/${ride.id}`}
                className="card bg-base-100 shadow transition hover:shadow-md"
              >
                <div className="card-body flex-row flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">
                      {ride.pickupZone.name} &rarr; {ride.destinationZone.name}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {formatSeats(ride.seatsRequested)} &middot;{" "}
                      {formatDistance(ride.distanceKm)} km &middot; requested{" "}
                      {formatTimestamp(ride.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {formatPoysha(ride.fareEstimatePoysha)}
                    </span>
                    <span
                      className={`badge ${statusBadgeClass(ride.status)}`}
                    >
                      {ride.statusLabel}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-base-content/50">
        Back to{" "}
        <Link className="link" href="/dashboard">
          your dashboard
        </Link>
      </p>
    </Layout>
  );
};

export default RidesPage;