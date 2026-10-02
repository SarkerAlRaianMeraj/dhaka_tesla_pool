import Link from "next/link";
import { Layout } from "@/components/Layout/layout";

/**
 * 404 body for every unmatched route.
 *
 * `frontend/rules.md` asks for this file at the app root, which makes it the
 * fallback for any route added later as well as for the paths that exist now.
 */
const NotFound = () => (
  <Layout>
    <p className="font-mono text-sm text-primary">404</p>
    <h1 className="text-3xl font-semibold tracking-tight">
      That page is not on the map
    </h1>
    <p className="max-w-prose text-sm text-base-content/70">
      The link may be stale, or the zone code in the address may not exist.
      Dhaka has eight zones in the system; this is not one of them.
    </p>
    <div className="flex flex-wrap gap-2">
      <Link className="btn btn-primary btn-sm" href="/">
        Back to overview
      </Link>
      <Link className="btn btn-ghost btn-sm" href="/dashboard">
        Go to my dashboard
      </Link>
    </div>
  </Layout>
);

export default NotFound;