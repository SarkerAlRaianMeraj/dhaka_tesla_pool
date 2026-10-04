import { Layout } from "@/components/Layout/layout";

/**
 * Route-level fallback for `/tesla`, required by `frontend/rules.md`.
 *
 * Everything on this page is fetched in the browser because it is scoped by the
 * session cookie, which a server component cannot read. This covers the transition
 * into the route; the page's own skeleton then covers the Tesla read, which happens
 * after this one has already gone.
 */
const TeslaLoading = () => (
  <Layout>
    <div className="flex flex-col gap-3">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-32 w-full" />
    </div>
  </Layout>
);

export default TeslaLoading;