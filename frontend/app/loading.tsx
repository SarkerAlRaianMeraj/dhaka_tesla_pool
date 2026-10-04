import { Layout } from "@/components/Layout/layout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level fallback required by `frontend/rules.md`.
 *
 * There is no API call here to fail, so the skeleton mirrors the hero block the
 * landing page shows. It is instant and stable, which is why it stays a server
 * component with no client JavaScript.
 *
 * The block shapes mirror the real page — a hero panel and a three-up row — so the
 * layout does not jump when content replaces it. `Skeleton` carries the `sr-only`
 * label: an unlabelled set of pulsing rectangles announces as nothing at all.
 */
const HomeLoading = () => (
  <Layout>
    <div
      className="flex flex-col gap-5 rounded-[26px] border border-ink/6 bg-white px-7 py-12 shadow-[0_20px_48px_color-mix(in_oklab,var(--color-ink)_5%,transparent)]"
      role="status"
      aria-label="Loading the overview"
    >
      <Skeleton className="h-3 w-24" label="Loading the overview" />
      <Skeleton className="h-10 w-3/4" label="Loading the overview" />
      <Skeleton className="h-5 w-1/2" label="Loading the overview" />
    </div>
    <div className="grid gap-3 sm:grid-cols-3" role="status" aria-label="Loading">
      {["a", "b", "c"].map((k) => (
        <div
          key={k}
          className="rounded-[26px] border border-ink/6 bg-white px-6 py-6 shadow-[0_20px_48px_color-mix(in_oklab,var(--color-ink)_5%,transparent)]"
        >
          <Skeleton className="h-4 w-2/3" label="Loading" />
        </div>
      ))}
    </div>
  </Layout>
);

export default HomeLoading;