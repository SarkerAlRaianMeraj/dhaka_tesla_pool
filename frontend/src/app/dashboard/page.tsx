"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/form-controls";
import { ApiError, apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Zone } from "@/lib/types";

/**
 * The role-aware landing screen after sign-in.
 *
 * It exists to prove the identity slice end to end: the JWT decides which of the
 * two home screens is rendered, and the zone list proves the browser is making
 * authenticated calls. Ride requests and Tesla registration arrive in later
 * phases, so each panel states plainly what is not built yet rather than showing
 * a fake control.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiRequest<Zone[]>("/zones", { token })
      .then((data) => {
        if (!cancelled) setZones(data);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load the zone list.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, token, router]);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 text-sm text-zinc-500">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">
            {user.role === "driver" ? "Driver home" : "Passenger home"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Hello, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Signed in as {user.email} &middot; role{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5">{user.role}</code>
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {user.role === "passenger" ? (
          <article className="rounded-lg border border-zinc-200 p-4">
            <h2 className="font-medium">Request a ride</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Pick a pickup and destination, see the exact fare before you commit,
              then watch the status change as drivers accept. Arrives in phase 2.
            </p>
          </article>
        ) : (
          <article className="rounded-lg border border-zinc-200 p-4">
            <h2 className="font-medium">Register Bullet</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Add your Tesla with its seat capacity, go online, and see only the
              requests a pooled route can actually serve. Arrives in phase 3.
            </p>
          </article>
        )}
        <article className="rounded-lg border border-zinc-200 p-4">
          <h2 className="font-medium">Your TeslaPay balance</h2>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {user.teslaPayBalancePoysha.toLocaleString("en-US")}{" "}
            <span className="text-base font-normal text-zinc-500">poysha</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Simulated wallet, integer poysha, never a float. Top-ups arrive in phase 6.
          </p>
        </article>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Dhaka zones in the system</h2>
        <FormError>{error}</FormError>
        <ul className="grid gap-2 sm:grid-cols-2">
          {zones.map((zone) => (
            <li
              key={zone.code}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
            >
              <span className="font-medium">{zone.name}</span>
              <span className="text-zinc-500"> &middot; {zone.code}</span>
              <span className="block text-xs text-zinc-500">
                {zone.corridors.map((corridor) => corridor.code).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-zinc-500">
        Back to the{" "}
        <Link className="underline" href="/">
          overview
        </Link>
      </p>
    </main>
  );
}