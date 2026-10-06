import type { ReactNode } from "react";

/**
 * The design's primary action, from spec §9: mint fill, ink label, 16px radius,
 * 50px minimum height, its own soft shadow, and a 2px lift on hover.
 *
 * This is not `btn-primary`. daisyUI's `btn-primary` would now resolve to mint via the
 * Kinetic theme (see `app/globals.css`), but its shadow, border and focus treatment are
 * daisyUI's, not the design's, and the design's spec pins all four. `className` is merged
 * but not required, so the agreed metrics cannot be quietly dropped per call site.
 */
const CONTROL =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-display text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55";

/**
 * The mint CTA. The design gives it the strongest affordance on any screen, so it takes
 * exactly one per view in practice - a screen with two is a screen that has not decided
 * what it wants the user to do.
 */
export const PrimaryAction = ({
  children,
  className = "",
  ...rest
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`${CONTROL} min-h-[50px] w-full bg-mint px-6 text-ink shadow-[0_10px_24px_color-mix(in_oklab,var(--color-mint)_28%,transparent)] hover:translate-y-[-2px] hover:shadow-[0_14px_30px_color-mix(in_oklab,var(--color-mint)_36%,transparent)] active:translate-y-0 active:scale-[.98] ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

/**
 * The low-emphasis action: a hairline-bordered ghost button in forest.
 *
 * It is the counterpart to `PrimaryAction` on the forms that have a real cancel
 * affordance, so a user who opens a ride request has a way out that does not look like
 * a second, equally weighted commitment.
 */
export const GhostAction = ({
  children,
  className = "",
  ...rest
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`${CONTROL} min-h-[50px] w-full border border-forest/20 bg-transparent px-6 text-forest hover:border-forest/35 hover:bg-white/60 active:scale-[.98] ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

/**
 * The quiet action for a row that needs only a link-weight affordance - "Cancel",
 * "Change", "Retry". Unbordered so it cannot be mistaken for a panel-level CTA.
 */
export const QuietAction = ({
  children,
  className = "",
  ...rest
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 font-display text-sm font-semibold text-forest/75 transition hover:bg-white/70 hover:text-forest disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);