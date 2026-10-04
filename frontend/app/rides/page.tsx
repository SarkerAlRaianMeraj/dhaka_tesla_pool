"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import {
  formatDistance,
  formatPoysha,
  formatSeats,
  formatTimestamp,
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
        <p className="text-sm text-ink/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Eyebrow>Passenger</Eyebrow>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Your rides
          </h1>
          <p className="text-sm text-ink/60">
            {rides.length === 0
              ? "Nothing requested yet."
              : `${rides.length} ${rides.length === 1 ? "ride" : "rides"}, most recent first.`}
          </p>
        </div>
        <Link
          href="/rides/request"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-mint px-5 font-display text-sm font-semibold text-ink shadow-[0_8px_18px_color-mix(in_oklab,var(--color-mint)_24%,transparent)] transition hover:translate-y-[-2px] active:translate-y-0 active:scale-[.98]"
        >
          Request a ride
        </Link>
      </header>

      <FormError>{error}</FormError>

      {isLoadingRides ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((k) => (
            <Panel key={k} className="px-6 py-6">
              <Skeleton className="h-5 w-2/5" label="Loading your rides" />
              <Skeleton className="mt-3 h-4 w-3/5" label="Loading your rides" />
            </Panel>
          ))}
        </div>
      ) : rides.length === 0 ? (
        <Panel className="animate-rise px-7 py-10">
          <div className="flex flex-col items-start gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              No rides yet
            </h2>
            <p className="text-sm text-ink/60">
              Request a ride and it will appear here with its fare and status.
            </p>
            <Link
              href="/rides/request"
              className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-mint px-5 font-display text-sm font-semibold text-ink shadow-[0_8px_18px_color-mix(in_oklab,var(--color-mint)_24%,transparent)] transition hover:translate-y-[-2px] active:translate-y-0 active:scale-[.98]"
            >
              Request your first ride
            </Link>
          </div>
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          {rides.map((ride) => (
            <li key={ride.id}>
              {/*
                The whole row is one link. The route is written as three spans rather
                than `{from} → {to}` so the arrow can carry the mint accent without
                the zone names inheriting it.
              */}
              <Link
                href={`/rides/${ride.id}`}
                className="block rounded-[26px] transition hover:-translate-y-0.5"
              >
                <Panel className="px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-display flex items-center gap-2 font-semibold text-ink">
                        <span className="truncate">{ride.pickupZone.name}</span>
                        <span aria-hidden className="text-mint">
                          &rarr;
                        </span>
                        <span className="truncate">{ride.destinationZone.name}</span>
                      </p>
                      <p className="text-xs text-ink/55">
                        {formatSeats(ride.seatsRequested)} &middot;{" "}
                        {formatDistance(ride.distanceKm)} km &middot; requested{" "}
                        {formatTimestamp(ride.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/*
                        `tabular-nums` because these are poysha amounts that are meant
                        to line up down the column when a passenger compares two rides.
                      */}
                      <span className="font-display font-semibold tabular-nums text-ink">
                        {formatPoysha(ride.fareEstimatePoysha)}
                      </span>
                      <StatusPill
                        status={ride.status}
                        label={ride.statusLabel}
                      />
                    </div>
                  </div>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-ink/50">
        Back to{" "}
        <Link
          className="font-semibold text-forest underline decoration-mint decoration-2 underline-offset-4 hover:decoration-forest"
          href="/dashboard"
        >
          your dashboard
        </Link>
      </p>
    </Layout>
  );
};

export default RidesPage;