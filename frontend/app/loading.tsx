import { Layout } from "@/components/Layout/layout";

/**
 * Route-level fallback required by `frontend/rules.md`.
 *
 * There is no API call here to fail, so the skeleton mirrors the hero block the
 * landing page shows. It is instant and stable, which is why it stays a server
 * component with no client JavaScript.
 */
const HomeLoading = () => (
  <Layout>
    <div className="flex flex-col gap-3">
      <div className="skeleton h-9 w-3/4" />
      <div className="skeleton h-5 w-1/2" />
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-32 w-full" />
    </div>
  </Layout>
);

export default HomeLoading;