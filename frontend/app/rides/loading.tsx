import { Layout } from "@/components/Layout/layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback for `/rides`, required by `frontend/rules.md`.
 *
 * The list fetches in the browser because the ride list is scoped by the session
 * cookie, which the server component cannot read. This skeleton matches the list's
 * shape so the layout does not jump when the rows arrive.
 *
 * The rows are Skeletons of the real height rather than generic blocks, and they sit
 * inside the same Panel the list renders, so the first paint already shows the 26px
 * card geometry the design specifies instead of correcting into it a moment later.
 */
const RidesLoading = () => (
  <Layout>
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-1/3" label="Loading your rides" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full rounded-[26px]" label="Loading your rides" />
        <Skeleton className="h-28 w-full rounded-[26px]" label="Loading your rides" />
      </div>
    </div>
  </Layout>
);

export default RidesLoading;