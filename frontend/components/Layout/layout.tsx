import type { ReactNode } from "react";

/**
 * The reusable page wrapper required by `frontend/rules.md`.
 *
 * Every screen needs the same three things: the flex-grow slot that pushes the
 * footer down, a width cap so long lines stay readable, and consistent padding.
 * Centralising them here is what stops each page from inventing its own
 * container and drifting apart.
 *
 * Pages pass their own heading, so the document outline stays in the page where
 * the content lives.
 */
type LayoutProps = {
  children: ReactNode;
  width?: "narrow" | "wide";
};

const WIDTHS = {
  narrow: "max-w-md",
  wide: "max-w-5xl",
} as const;

export const Layout = ({ children, width = "wide" }: LayoutProps) => (
  <main
    className={`mx-auto flex w-full ${WIDTHS[width]} flex-1 flex-col gap-8 px-4 py-12`}
  >
    {children}
  </main>
);