"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import type { Zone } from "@/lib/types";

/**
 * The role-aware landing screen after sign-in.
 *
 * It proves the identity slice end to end: the session cookie decides which of
 * the two home screens is rendered, and the zone list proves the browser is
 * making authenticated calls. Ride requests and Tesla registration arrive in
 * later phases, so each panel states plainly what is not built yet rather than
 * showing a control that does nothing.
 */
const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneError, setZoneError] = useState<string | undefined>(undefined);

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
        setZoneError(getErrorMessage(caught, "Could not load the zone list."));
      }
    };

    void fetchZones();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-base-content/60">
          Checking your session...
        </p>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            {user.role === "driver" ? "Driver home" : "Passenger home"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            Signed in as {user.email} &middot; role{" "}
            <span className="badge badge-outline badge-sm">{user.role}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="btn btn-outline btn-sm"
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {user.role === "passenger" ? (
          <article className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Request a ride</h2>
              <p className="text-sm text-base-content/70">
                Pick a pickup and destination, see the exact fare before you
                commit, then watch the status change as drivers accept. Arrives in
                phase 2.
              </p>
            </div>
          </article>
        ) : (
          <article className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Register Bullet</h2>
              <p className="text-sm text-base-content/70">
                Add your Tesla with its seat capacity, go online, and see only the
                requests a pooled route can actually serve. Arrives in phase 3.
              </p>
            </div>
          </article>
        )}
        <article className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Your TeslaPay balance</h2>
            <p className="text-3xl font-semibold tabular-nums">
              {user.teslaPayBalancePoysha.toLocaleString("en-US")}{" "}
              <span className="text-base font-normal text-base-content/60">
                poysha
              </span>
            </p>
            <p className="text-sm text-base-content/70">
              Simulated wallet, integer poysha, never a float. Top-ups arrive in
              phase 6.
            </p>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Dhaka zones in the system</h2>
        <FormError>{zoneError}</FormError>
        <ul className="grid gap-2 sm:grid-cols-2">
          {zones.map((zone) => (
            <li
              key={zone.code}
              className="rounded-box border border-base-300 px-3 py-2 text-sm"
            >
              <span className="font-medium">{zone.name}</span>{" "}
              <span className="text-base-content/50">{zone.code}</span>
              <span className="block text-xs text-base-content/50">
                {zone.corridors.map((corridor) => corridor.code).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-base-content/50">
        Back to the{" "}
        <Link className="link" href="/">
          overview
        </Link>
      </p>
    </Layout>
  );
};

export default DashboardPage;