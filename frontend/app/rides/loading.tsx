import { Layout } from "@/components/Layout/layout";

/**
 * Route-level fallback for `/rides`, required by `frontend/rules.md`.
 *
 * The list fetches in the browser because the ride list is scoped by the session
 * cookie, which the server component cannot read. This skeleton matches the list's
 * shape so the layout does not jump when the rows arrive.
 */
const RidesLoading = () => (
  <Layout>
    <div className="flex flex-col gap-3">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-28 w-full" />
      <div className="skeleton h-28 w-full" />
    </div>
  </Layout>
);

export default RidesLoading;