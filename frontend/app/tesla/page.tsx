"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError, PrimaryButton, TextInput } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { apiClient, getErrorMessage, isUnauthorized } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth-context";
import { formatPoysha, formatSeats, formatTimestamp } from "@/lib/format";
import { firstIssue, teslaRegistrationSchema } from "@/lib/schemas";
import type { MatchableRide, MyTesla, Tesla, TeslaAvailability } from "@/lib/types";

const CAPACITY_OPTIONS = [1, 2, 3];

/**
 * The driver's Tesla: registration when they have none, summary and availability
 * once they do (FR-D3, D26).
 *
 * One route does both jobs on purpose. The two states are the same page's two
 * faces, so keeping them together means a driver who registers lands on the thing
 * they registered rather than being routed away to look for it.
 *
 * The empty state is `tesla: null` inside a 200 response, not a 404. "You have not
 * registered yet" is the ordinary opening state of this screen, and treating it as
 * an error would put the one state most drivers see first into the catch branch.
 */
const TeslaPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [tesla, setTesla] = useState<Tesla | null>(null);
  const [isLoadingTesla, setIsLoadingTesla] = useState(true);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState(3);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [isRegistering, setIsRegistering] = useState(false);

  const [isSettingAvailability, setIsSettingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<
    string | undefined
  >(undefined);

  const [requests, setRequests] = useState<MatchableRide[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | undefined>(
    undefined,
  );

  // The session decides whether this page exists for the caller at all, so the
  // role check happens here rather than letting four requests come back 403.
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "driver") {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (isLoading || !user || user.role !== "driver") return;

    let cancelled = false;

    const fetchTesla = async (): Promise<void> => {
      setIsLoadingTesla(true);
      try {
        const response = await apiClient.get<MyTesla>("/tesla/me");
        if (!cancelled) {
          /*
           * `?? null` is belt and braces on top of the envelope. The API answers
           * `{ tesla: null }` for a driver with nothing registered, but normalising
           * here means a malformed or truncated response lands in the same safe
           * branch as a genuine empty state instead of leaving `tesla` undefined and
           * rendering a summary card full of "undefined".
           */
          setTesla(response.data?.tesla ?? null);
          setLoadError(undefined);
        }
      } catch (caught) {
        if (cancelled) return;
        if (isUnauthorized(caught)) {
          router.replace("/login");
          return;
        }
        setLoadError(
          getErrorMessage(caught, "Could not load your Tesla registration."),
        );
      } finally {
        if (!cancelled) setIsLoadingTesla(false);
      }
    };

    void fetchTesla();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, router]);

  /**
   * The feed is only fetched once a Tesla exists, because the API refuses it
   * before then: there is nothing for open requests to match to without a vehicle,
   * and an empty feed would read as "nobody wants a ride" instead.
   */
  useEffect(() => {
    if (!tesla) return;

    let cancelled = false;

    const fetchRequests = async (): Promise<void> => {
      setIsLoadingRequests(true);
      try {
        const response = await apiClient.get<MatchableRide[]>(
          "/tesla/requests",
        );
        if (!cancelled) {
          setRequests(response.data);
          setRequestsError(undefined);
        }
      } catch (caught) {
        if (cancelled) return;
        setRequestsError(
          getErrorMessage(caught, "Could not load matchable requests."),
        );
      } finally {
        if (!cancelled) setIsLoadingRequests(false);
      }
    };

    void fetchRequests();
    return () => {
      cancelled = true;
    };
  }, [tesla]);

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const result = teslaRegistrationSchema.safeParse({ plate, capacity });
    if (!result.success) {
      setSubmitError(firstIssue(result.error));
      return;
    }

    setSubmitError(undefined);
    setIsRegistering(true);
    try {
      const response = await apiClient.post<Tesla>("/tesla", result.data);
      /*
       * The response replaces the form rather than a second read, so the summary
       * can never disagree with what the server just stored.
       */
      setTesla(response.data);
      setPlate("");
    } catch (caught) {
      setSubmitError(
        getErrorMessage(
          caught,
          "Could not reach the API. Is the backend running on port 3000?",
        ),
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAvailabilityChange = async (
    availability: TeslaAvailability,
  ): Promise<void> => {
    setIsSettingAvailability(true);
    setAvailabilityError(undefined);
    try {
      const response = await apiClient.post<Tesla>("/tesla/availability", {
        availability,
      });
      /*
       * The toggle's position is taken from the server's answer, not set
       * optimistically. If the write failed the switch would otherwise sit in a
       * state the database does not agree with, which is exactly the sort of lie
       * this page must not tell a driver deciding whether to accept work.
       */
      setTesla(response.data);
    } catch (caught) {
      setAvailabilityError(
        getErrorMessage(caught, "Could not change your availability."),
      );
    } finally {
      setIsSettingAvailability(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <p className="text-sm text-base-content/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user || user.role !== "driver") return null;

  return (
    <Layout>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Your Tesla</h1>
        <p className="text-sm text-base-content/70">
          {tesla
            ? "Toggle availability and watch for requests you can serve."
            : "Register the Tesla you drive before you can take requests."}
        </p>
      </div>

      <FormError>{loadError}</FormError>

      {isLoadingTesla ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-8 w-1/3" />
          <div className="skeleton h-32 w-full" />
        </div>
      ) : tesla === null ? (
        <form className="card bg-base-100 shadow-xl" onSubmit={handleRegister}>
          <div className="card-body flex flex-col gap-4">
            <TextInput
              label="Registration plate"
              name="plate"
              value={plate}
              onChange={(event) => setPlate(event.target.value)}
              hint="Exactly as it reads on the number plate. Spaces and letter case are normalised for you."
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-base-content">
                Passenger seats
              </legend>
              <div className="join">
                {CAPACITY_OPTIONS.map((seats) => (
                  <button
                    key={seats}
                    type="button"
                    onClick={() => setCapacity(seats)}
                    aria-pressed={capacity === seats}
                    className={`btn join-item btn-sm ${
                      capacity === seats ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {seats}
                  </button>
                ))}
              </div>
              <p className="text-xs text-base-content/60">
                Fixed once you register. Pooling never puts more passengers aboard
                than this number.
              </p>
            </fieldset>

            <FormError>{submitError}</FormError>

            <PrimaryButton pending={isRegistering}>
              Register my Tesla
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <>
          <article className="card bg-base-100 shadow-xl">
            <div className="card-body flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="card-title">{tesla.plate}</h2>
                  <p className="text-sm text-base-content/70">
                    {tesla.model} &middot; {formatSeats(tesla.capacity)}
                  </p>
                </div>
                <span
                  className={`badge ${
                    tesla.availability === "ONLINE"
                      ? "badge-success"
                      : "badge-ghost"
                  }`}
                >
                  {tesla.availability === "ONLINE" ? "Online" : "Offline"}
                </span>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {tesla.availability === "ONLINE" ? "Go offline" : "Go online"}
                  </span>
                  <span className="text-xs text-base-content/60">
                    {tesla.availability === "ONLINE"
                      ? "You are listed as available for new requests."
                      : "Go online to start receiving requests you can serve."}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={tesla.availability === "ONLINE"}
                  disabled={isSettingAvailability}
                  onChange={(event) =>
                    void handleAvailabilityChange(
                      event.target.checked ? "ONLINE" : "OFFLINE",
                    )
                  }
                />
              </label>

              <FormError>{availabilityError}</FormError>
            </div>
          </article>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">Matchable requests</h2>
              <p className="text-sm text-base-content/70">
                {requests.length === 0
                  ? "No open requests right now."
                  : `${requests.length} open ${requests.length === 1 ? "request" : "requests"}.`}
              </p>
              {/*
                Stating the limit plainly beats implying a smarter filter. In this
                phase every open request is listed, because the pooling rule compares
                two requests and a driver's first request does not exist yet; the
                corridor check starts narrowing this list once you accept one (D27).
              */}
              {requests.length > 0 && tesla.availability === "ONLINE" ? (
                <p className="text-xs text-base-content/60">
                  Narrowing by shared pickup zone and corridor starts when you
                  accept a request in the next phase.
                </p>
              ) : null}
            </div>

            <FormError>{requestsError}</FormError>

            {isLoadingRequests ? (
              <div className="flex flex-col gap-3">
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <article className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="card-title text-base">Nothing to match yet</h3>
                  <p className="text-sm text-base-content/70">
                    When a passenger requests a ride, it will appear here with the
                    route and the fare it would pay.
                  </p>
                </div>
              </article>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.map((request) => (
                  <li
                    key={request.id}
                    className="card bg-base-100 shadow"
                  >
                    <div className="card-body flex-row flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">
                          {request.pickupZoneName} &rarr;{" "}
                          {request.destinationZoneName}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {formatSeats(request.seatsRequested)} &middot;{" "}
                          {request.pickupZoneCode} to{" "}
                          {request.destinationZoneCode} &middot; requested{" "}
                          {formatTimestamp(request.createdAt)}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums">
                        {formatPoysha(request.fareEstimatePoysha)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
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

export default TeslaPage;