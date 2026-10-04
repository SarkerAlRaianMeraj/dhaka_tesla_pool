"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect } from "react";
import { BookingPanel } from "@/components/dashboard/BookingPanel";
import { LastRideStrip } from "@/components/dashboard/LastRideStrip";
import { MapPanel } from "@/components/dashboard/MapPanel";
import { RideStatusPanel } from "@/components/dashboard/RideStatusPanel";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/lib/auth-context";
import { usePassengerRides } from "@/lib/use-rides";
import { useRideBooking } from "@/lib/use-ride-booking";
import type { SessionUser } from "@/lib/types";

/**
 * The driver home.
 *
 * A driver has no booking to make, so this stays a small routing screen: register
 * the Tesla on `/tesla`, then go online. It is deliberately not dressed up as the
 * passenger dashboard, because there is nothing on that screen a driver could use.
 */
const DriverHome = ({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) => (
  <div className="mx-auto w-full max-w-5xl px-4 py-10">
    <h1 className="text-3xl font-semibold tracking-tight">Driver home</h1>
    <p className="mt-1 text-sm text-base-content/70">
      Hello, {user.name.split(" ")[0]} &middot; signed in as {user.email}
    </p>
    <p className="mt-1 text-sm text-base-content/70">
      Your TeslaPay balance is {user.teslaPayBalancePoysha.toLocaleString("en-US")}{" "}
      poysha.
    </p>
    <div className="mt-6 flex gap-3">
      <Link href="/tesla" className="btn btn-primary btn-sm">
        Set up your Tesla
      </Link>
      <button type="button" onClick={onSignOut} className="btn btn-outline btn-sm">
        Sign out
      </button>
    </div>
  </div>
);

/**
 * The passenger home: the "Kinetic Glass Rails" dashboard.
 *
 * Every figure on this screen comes from the API - the eight zones, the fare from
 * `POST /rides/quote`, the TeslaPay balance on the session, the trip status from
 * `GET /rides`. The one simulated element is the map's illustration, which is
 * labelled as such on its own face.
 *
 * The rail lives here rather than in the root layout, so `Chrome` withholds the
 * navbar and footer on this route instead of the dashboard hiding them from under
 * a global shell.
 */
const PassengerHome = ({
  user,
  onSignOut,
}: {
  user: SessionUser;
  onSignOut: () => void;
}) => {
  const router = useRouter();
  const goToLogin = useCallback(() => router.replace("/login"), [router]);

  const booking = useRideBooking(goToLogin);
  const { activeRide, lastRide, error: ridesError } = usePassengerRides(goToLogin);

  const { zones, pickupZoneCode, destinationZoneCode, currentQuote, submit } =
    booking;

  const pickup = zones.find((zone) => zone.code === pickupZoneCode);
  const destination = zones.find((zone) => zone.code === destinationZoneCode);

  /** A created ride is the passenger's next stop: its own detail page. */
  const handleRequest = async (): Promise<void> => {
    const ride = await submit();
    if (ride) router.push(`/rides/${ride.id}`);
  };

  return (
    <div className="flex min-h-screen gap-6 p-6 max-[700px]:p-3">
      <Sidebar />

      <main className="mx-auto w-full max-w-[1320px] min-w-0 px-2 pt-6 pb-6 max-[700px]:px-0 max-[700px]:pb-[88px]">
        <Topbar user={user} />

        {ridesError ? (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {ridesError}
          </p>
        ) : null}

        <div className="grid grid-cols-[minmax(340px,.78fr)_minmax(540px,1.22fr)] gap-[26px] max-[1050px]:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-5">
            <BookingPanel
              booking={booking}
              onRequest={() => void handleRequest()}
            />
            <RideStatusPanel ride={activeRide} />
            <LastRideStrip ride={lastRide} />
            <p className="px-2 text-xs text-forest/50">
              <button
                type="button"
                onClick={onSignOut}
                className="link link-hover"
              >
                Sign out
              </button>
              {" · "}
              <Link href="/rides" className="link link-hover">
                All my rides
              </Link>
            </p>
          </div>

          <MapPanel
            pickup={pickup}
            destination={destination}
            quote={currentQuote}
            seatsRequested={booking.seatsRequested}
            hasActiveRide={activeRide !== undefined}
          />
        </div>
      </main>
    </div>
  );
};

/**
 * The role-aware landing screen after sign-in.
 *
 * A passenger gets the booking dashboard; a driver gets the Tesla setup hand-off.
 * Both are decided from the session cookie, which is the single source of truth
 * about who is here.
 */
const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <p className="p-6 text-sm text-base-content/60">Checking your session...</p>
    );
  }

  if (!user) return null;

  const onSignOut = () => void logout();

  return user.role === "driver" ? (
    <DriverHome user={user} onSignOut={onSignOut} />
  ) : (
    <PassengerHome user={user} onSignOut={onSignOut} />
  );
};

export default DashboardPage;