import { Layout } from "@/components/Layout/layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback for `/tesla`, required by `frontend/rules.md`.
 *
 * Everything on this page is fetched in the browser because it is scoped by the
 * session cookie, which a server component cannot read. This covers the transition
 * into the route; the page's own skeleton then covers the Tesla read, which happens
 * after this one has already gone.
 *
 * The wide block is the Panel geometry, not a generic bar, so a driver moving to this
 * route sees the same 26px surface appear and then fill, rather than a rectangle that
 * changes shape on arrival.
 */
const TeslaLoading = () => (
  <Layout>
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-1/3" label="Loading your Tesla" />
      <Skeleton className="h-40 w-full rounded-[26px]" label="Loading your Tesla" />
    </div>
  </Layout>
);

export default TeslaLoading;