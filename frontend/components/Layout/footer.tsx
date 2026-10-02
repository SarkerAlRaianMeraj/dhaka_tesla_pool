import Link from "next/link";

/**
 * Static site footer. Presentational only, so it stays a server component and
 * costs no client JavaScript.
 */
export const Footer = () => (
  <footer className="border-t border-base-300 bg-base-100">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Dhaka Tesla Pool &middot; an academic MVP. No real money moves and no
        real rides are dispatched.
      </p>
      <p>
        <Link className="link link-hover" href="/">
          Back to top
        </Link>
      </p>
    </div>
  </footer>
);