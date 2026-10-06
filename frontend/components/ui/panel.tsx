import type { ReactNode } from "react";

/*
 * The design's one panel treatment, from spec §8:
 *
 *   border: 1px solid color-mix(in oklab, var(--ink) 6%, transparent);
 *   border-radius: 26px;
 *   background: white;
 *   box-shadow: 0 20px 48px color-mix(in oklab, var(--ink) 5%, transparent);
 *
 * It lives here rather than being restated per screen because these four values are
 * what makes a screen read as "Kinetic Glass Rails". Restating them is how a redesign
 * drifts: the first panel is 26px and the fifth is 24px and nothing looks wrong until
 * the two are adjacent.
 *
 * The same values were written literally into each dashboard component before this
 * existed. They are left there rather than refactored here, because churning already
 * verified components to deduplicate class strings trades real regression risk for
 * tidiness - new work goes through this component, and consolidation is a separate
 * decision (see `docs/decisions.md`).
 */
export const PANEL_CLASS =
  "rounded-[26px] border border-ink/6 bg-white shadow-[0_20px_48px_color-mix(in_oklab,var(--color-ink)_5%,transparent)]";

/**
 * A floating white surface.
 *
 * `as` lets a screen choose the element that carries the semantics - a `<section>`
 * for a page region, an `<article>` for one repeated item - because a panel that is
 * semantically a list item should not have to be a `<div>` to get its border.
 */
export const Panel = ({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
} & React.HTMLAttributes<HTMLElement>) => (
  <Tag className={`${PANEL_CLASS} ${className}`.trim()} {...rest}>
    {children}
  </Tag>
);

/**
 * The small uppercase eyebrow the design uses above every heading: forest at 55%,
 * 10px, bold, `.18em` tracking.
 *
 * It is `text` rather than a heading because it labels the heading that follows it
 * rather than standing on its own in the document outline - two `<h2>`s in a row for
 * one visual block is a lie to a screen reader.
 */
export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="m-0 text-[10px] font-bold tracking-[.18em] text-forest/55 uppercase">
    {children}
  </p>
);

/** A display-face heading. Outfit, semibold, ink. */
export const PanelTitle = ({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) => <Tag className={`font-display text-ink ${className}`.trim()}>{children}</Tag>;

/**
 * An unframed area inside a panel.
 *
 * Spec §8: "Do not nest a decorative card inside another card. Internal areas are
 * unframed rows, controls, and dividers." This is that internal area - it carries
 * separation without a second border-and-shadow box.
 */
export const PanelRow = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`border-t border-ink/6 px-7 py-5 ${className}`.trim()}>{children}</div>;