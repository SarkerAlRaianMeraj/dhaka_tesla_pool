import Link from "next/link";

/**
 * Static site footer. Presentational only, so it stays a server component and
 * costs no client JavaScript.
 *
 * Translucent over the page canvas to match the navbar. The MVP disclaimer stays in
 * full: it is the sentence that stops this being read as a live ride-hailing service,
 * and shortening it to fit a visual is exactly the wrong trade.
 */
export const Footer = () => (
  <footer className="mt-auto border-t border-ink/6 bg-white/70">
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-ink/55 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Dhaka Tesla Pool &middot; an academic MVP. No real money moves and no
        real rides are dispatched.
      </p>
      <p>
        <Link className="font-semibold text-forest/70 hover:text-forest" href="/">
          Back to top
        </Link>
      </p>
    </div>
  </footer>
);