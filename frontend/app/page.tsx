import Link from "next/link";
import { Layout } from "@/components/Layout/layout";
import { Eyebrow, Panel } from "@/components/ui/panel";

const CAST = [
  {
    name: "Jashim",
    role: "Driver",
    detail: "Owns Bullet, a three-seat Tesla. Wants full seats and a clear go-signal.",
  },
  {
    name: "Nusrat",
    role: "Passenger",
    detail: "Banani to Mohakhali, already late. Wants a seat held and an exact fare.",
  },
  {
    name: "Rafiq",
    role: "Passenger",
    detail: "Banani to Gulshan 1. Willing to share, as long as the fare does not move.",
  },
  {
    name: "Shirin",
    role: "Passenger",
    detail:
      "Thirty seconds late for the last seat. Needs either a seat or an honest answer.",
  },
];

/**
 * How pooling actually decides, in the order it decides it.
 *
 * Every number and every rule here is copied from the seeded reference data and the
 * matching rule, not written for the page. That is the whole reason this replaced the
 * old "Phase 1 — identity and reference data" card: that card described the build
 * schedule, which is the one thing a visitor cannot use and the build team already
 * knows. This describes the product.
 *
 *  - Eight zones and four corridors, seeded by the first migration.
 *  - Two requests may share one Tesla only if pickup zones are *identical* and the
 *    destinations' corridors *overlap* (share at least one zone).
 *  - A zone can belong to more than one corridor — Mohakhali closes both the
 *    Banani-Gulshan and Dhanmondi-Farmgate corridors — which is why overlap is
 *    computed over sets rather than a single corridor per destination.
 */
const STEPS = [
  {
    n: "01",
    title: "Pickup zones, not addresses",
    body: "Dhaka is eight named zones across four corridors. You choose where the ride starts, so matching stays a lookup instead of a map problem.",
  },
  {
    n: "02",
    title: "Corridors decide compatibility",
    body: "Two requests share a Tesla only when their pickup zones are identical and their destination corridors overlap. Mohakhali closes two corridors, so overlap is computed across sets.",
  },
  {
    n: "03",
    title: "One fare, fixed at request",
    body: "Base fare plus distance charge, minus the sharing discount. The server prices the ride, and that exact figure is what the screen shows.",
  },
];

const Home = () => (
  <Layout>
    <Panel className="animate-rise overflow-hidden">
      <div className="flex flex-col items-start gap-5 px-7 py-12 sm:px-12 sm:py-16">
        <Eyebrow>Ride pooling MVP</Eyebrow>
        <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          Share a seat. Split the fare. Survive Dhaka traffic.
        </h1>
        <p className="max-w-2xl text-lg text-ink/65">
          Dhaka Tesla Pool decides, in about a second, whether two strangers can
          share one Tesla on compatible routes, then keeps each fare, seat, and
          status to itself.
        </p>
        {/*
          `PrimaryAction` is a <button>, so the hero CTA is a Link styled with the same
          class rather than the component itself — a link that navigates should not be
          a button with an onClick.
        */}
        <div className="mt-2 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/register"
            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-mint px-8 font-display text-sm font-semibold text-ink shadow-[0_10px_24px_color-mix(in_oklab,var(--color-mint)_28%,transparent)] transition hover:translate-y-[-2px] hover:shadow-[0_14px_30px_color-mix(in_oklab,var(--color-mint)_36%,transparent)] active:translate-y-0 active:scale-[.98]"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-forest/20 px-8 font-display text-sm font-semibold text-forest transition hover:border-forest/35 hover:bg-white/60 active:scale-[.98]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </Panel>

    <section className="flex flex-col gap-4">
      <Eyebrow>How it decides</Eyebrow>
      <Panel className="animate-rise [animation-delay:80ms]">
        <div className="grid gap-0 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`flex flex-col gap-2 px-7 py-8 ${i > 0 ? "border-t border-ink/6 sm:border-t-0 sm:border-l" : ""}`}
            >
              {/*
                The step number is decorative - the ordered list carries the sequence -
                so it is hidden from assistive tech rather than read as "zero one".
              */}
              <span
                aria-hidden
                className="font-display text-sm font-semibold text-mint"
              >
                {step.n}
              </span>
              <h3 className="font-display text-base font-semibold text-ink">
                {step.title}
              </h3>
              <p className="text-sm text-ink/60">{step.body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </section>

    <section className="flex flex-col gap-4">
      <Eyebrow>Who this is for</Eyebrow>
      <div className="grid gap-3 sm:grid-cols-2">
        {CAST.map((person) => (
          <Panel key={person.name} as="article">
            <div className="flex flex-col gap-2 px-6 py-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink">
                  {person.name}
                </h3>
                <span className="rounded-full bg-mint/20 px-2.5 py-1 text-[10px] font-bold tracking-[.12em] text-forest uppercase">
                  {person.role}
                </span>
              </div>
              <p className="text-sm text-ink/60">{person.detail}</p>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  </Layout>
);

export default Home;