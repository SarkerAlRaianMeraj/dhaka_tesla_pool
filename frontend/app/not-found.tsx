import Link from "next/link";
import { Layout } from "@/components/Layout/layout";
import { Eyebrow, Panel } from "@/components/ui/panel";

/**
 * 404 body for every unmatched route.
 *
 * `frontend/rules.md` asks for this file at the app root, which makes it the
 * fallback for any route added later as well as for the paths that exist now.
 *
 * "Dhaka has eight zones" is the seeded zone count, not decoration — a stale ride
 * link is the likeliest way to land here, and the count is what makes that guess
 * checkable.
 */
const NotFound = () => (
  <Layout width="narrow">
    <Panel className="animate-rise">
      <div className="flex flex-col items-start gap-4 px-7 py-12">
        <Eyebrow>404</Eyebrow>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-ink">
          That page is not on the map
        </h1>
        <p className="text-sm text-ink/60">
          The link may be stale, or the zone code in the address may not exist.
          Dhaka has eight zones in the system; this is not one of them.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-mint px-6 font-display text-sm font-semibold text-ink shadow-[0_10px_24px_color-mix(in_oklab,var(--color-mint)_28%,transparent)] transition hover:translate-y-[-2px] active:translate-y-0 active:scale-[.98]"
            href="/"
          >
            Back to overview
          </Link>
          <Link
            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-forest/20 px-6 font-display text-sm font-semibold text-forest transition hover:border-forest/35 hover:bg-white/60 active:scale-[.98]"
            href="/dashboard"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    </Panel>
  </Layout>
);

export default NotFound;