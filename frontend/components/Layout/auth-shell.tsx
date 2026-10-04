import Link from "next/link";
import type { ReactNode } from "react";

import { Panel } from "@/components/ui/panel";

/**
 * The composition shared by `/login` and `/register`: one centred panel on the paper
 * canvas, with a wordmark, a heading, the form, and one closing link.
 *
 * It is a component rather than a repeated block because the two pages must look like
 * the same place entered two ways. Duplicated by hand, the vertical centring and the
 * heading rhythm would drift apart within one release, and "which one is the real
 * login screen?" is the question that follows.
 *
 * `Layout` is deliberately not used here. It is the assignment's page wrapper and it
 * owns the flex-grow slot that pushes the footer down - but this route renders bare
 * (see `chrome.tsx`), so there is no footer to push and the panel needs to centre in
 * the full viewport height instead of in a padded column.
 */
export const AuthShell = ({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** The "no account yet?" / "already registered?" line. Rendered below the panel. */
  footer: ReactNode;
}) => (
  <main className="canvas-glow flex flex-1 items-center justify-center px-4 py-12">
    <div className="flex w-full max-w-md flex-col gap-6">
      <Link
        href="/"
        className="self-center font-display text-sm font-semibold tracking-tight text-forest"
      >
        Dhaka Tesla Pool
      </Link>

      <div className="animate-rise flex flex-col gap-1">
        <p className="m-0 text-[10px] font-bold tracking-[.18em] text-forest/55 uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="text-sm text-ink/60">{subtitle}</p>
      </div>

      <Panel className="animate-rise">
        <div className="flex flex-col gap-4 px-7 py-8">{children}</div>
      </Panel>

      <p className="text-center text-sm text-ink/60">{footer}</p>
    </div>
  </main>
);