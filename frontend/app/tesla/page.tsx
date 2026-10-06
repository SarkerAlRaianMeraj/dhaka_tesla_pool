"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError, PrimaryButton, TextInput } from "@/components/form-controls";
import { Layout } from "@/components/Layout/layout";
import { Eyebrow, Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
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
 *
 * The registration form is the same Panel + segmented control the passenger's
 * `/rides/request` screen uses. Both are "pick a value, see the real number", and a
 * driver should not have to learn a second control for a three-way choice.
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
        <p className="text-sm text-ink/60">Checking your session...</p>
      </Layout>
    );
  }

  if (!user || user.role !== "driver") return null;

  const isOnline = tesla?.availability === "ONLINE";

  return (
    <Layout>
      <div className="flex flex-col gap-1">
        <Eyebrow>Driver</Eyebrow>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Your Tesla
        </h1>
        <p className="text-sm text-ink/60">
          {tesla
            ? "Toggle availability and watch for requests you can serve."
            : "Register the Tesla you drive before you can take requests."}
        </p>
      </div>

      <FormError>{loadError}</FormError>

      {isLoadingTesla ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-1/3" label="Loading your Tesla" />
          <Skeleton className="h-32 w-full" label="Loading your Tesla" />
        </div>
      ) : tesla === null ? (
        <Panel as="section" className="animate-rise">
          <form className="flex flex-col gap-5 px-7 py-6" onSubmit={handleRegister}>
            <TextInput
              label="Registration plate"
              name="plate"
              value={plate}
              onChange={(event) => setPlate(event.target.value)}
              hint="Exactly as it reads on the number plate. Spaces and letter case are normalised for you."
            />

            <fieldset className="flex flex-col gap-2">
              <legend className="font-display text-sm font-medium text-ink">
                Passenger seats
              </legend>
              {/*
                The same segmented control as `/rides/request`, and for the same
                reason: three valid values, one click each, and the pressed state is
                what tells the driver what they just chose.
              */}
              <div
                role="group"
                aria-label="Passenger seats"
                className="grid grid-cols-3 gap-1.5"
              >
                {CAPACITY_OPTIONS.map((seats) => {
                  const selected = capacity === seats;
                  return (
                    <button
                      key={seats}
                      type="button"
                      onClick={() => setCapacity(seats)}
                      aria-pressed={selected}
                      className={`min-h-[48px] rounded-2xl border font-display text-base font-semibold tabular-nums transition active:scale-[.98] ${
                        selected
                          ? "border-mint bg-mint text-ink shadow-[0_10px_24px_rgba(112,196,168,0.28)]"
                          : "border-ink/14 bg-white/70 text-ink/70 hover:border-mint/55 hover:bg-white"
                      }`}
                    >
                      {seats}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink/55">
                Fixed once you register. Pooling never puts more passengers aboard
                than this number.
              </p>
            </fieldset>

            <FormError>{submitError}</FormError>

            <PrimaryButton pending={isRegistering}>
              Register my Tesla
            </PrimaryButton>
          </form>
        </Panel>
      ) : (
        <>
          <Panel as="article" className="animate-rise">
            <div className="flex flex-col gap-5 px-7 py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                    {tesla.plate}
                  </h2>
                  <p className="text-sm text-ink/60">
                    {tesla.model} &middot; {formatSeats(tesla.capacity)}
                  </p>
                </div>
                {/*
                  Online is the mint accent rather than daisy's success green, because
                  here it means "listed", not "no error". Offline is deliberately
                  quiet rather than a warning colour: going offline is a normal choice,
                  not a fault, and the copy below says so.
                */}
                <span
                  className={`inline-flex h-7 items-center rounded-full px-3 font-display text-[11px] font-semibold tracking-wide uppercase ${
                    isOnline
                      ? "bg-mint/22 text-forest ring-1 ring-mint/55"
                      : "bg-ink/6 text-ink/55 ring-1 ring-ink/12"
                  }`}
                >
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-paper/70 px-4 py-3.5">
                <span className="flex flex-col gap-1">
                  <span className="font-display text-sm font-medium text-ink">
                    {isOnline ? "Go offline" : "Go online"}
                  </span>
                  <span className="text-xs text-ink/55">
                    {isOnline
                      ? "You are listed as available for new requests."
                      : "Go online to start receiving requests you can serve."}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={isOnline}
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
          </Panel>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-semibold text-ink">
                Matchable requests
              </h2>
              <p className="text-sm text-ink/60">
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
              {requests.length > 0 && isOnline ? (
                <p className="text-xs text-ink/55">
                  Narrowing by shared pickup zone and corridor starts when you
                  accept a request in the next phase.
                </p>
              ) : null}
            </div>

            <FormError>{requestsError}</FormError>

            {isLoadingRequests ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-20 w-full" label="Loading requests" />
                <Skeleton className="h-20 w-full" label="Loading requests" />
              </div>
            ) : requests.length === 0 ? (
              <Panel as="article" className="animate-rise">
                <div className="flex flex-col gap-2 px-7 py-6">
                  <h3 className="font-display text-base font-semibold text-ink">
                    Nothing to match yet
                  </h3>
                  <p className="text-sm text-ink/60">
                    When a passenger requests a ride, it will appear here with the
                    route and the fare it would pay.
                  </p>
                </div>
              </Panel>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.map((request) => (
                  <li key={request.id}>
                    {/*
                      A Panel rather than a card-with-a-body: this row is a list item,
                      not a document, and the 26px radius now means "rides row" in this
                      app rather than "card" everywhere.
                    */}
                    <Panel className="animate-rise">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-7 py-5">
                        <div className="flex min-w-0 flex-col gap-1">
                          <p className="font-display flex flex-wrap items-center gap-1.5 font-medium text-ink">
                            <span>{request.pickupZoneName}</span>
                            <span aria-hidden className="text-mint">
                              &rarr;
                            </span>
                            <span>{request.destinationZoneName}</span>
                          </p>
                          <p className="text-xs text-ink/55">
                            {formatSeats(request.seatsRequested)} &middot;{" "}
                            {request.pickupZoneCode} to{" "}
                            {request.destinationZoneCode} &middot; requested{" "}
                            {formatTimestamp(request.createdAt)}
                          </p>
                        </div>
                        <span className="font-display text-base font-semibold tabular-nums text-ink">
                          {formatPoysha(request.fareEstimatePoysha)}
                        </span>
                      </div>
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="text-xs text-ink/55">
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

export default TeslaPage;