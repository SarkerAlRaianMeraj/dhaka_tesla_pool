"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

/**
 * Owns the site chrome that `app/layout.tsx` wraps around every page.
 *
 * The passenger dashboard is a full-height shell with its own 88px navigation
 * rail, so the top navbar and the footer would both sit outside a layout that
 * already provides its own navigation - the rail would be a second, competing
 * menu. The decision lives here, in one place, rather than as a path check
 * duplicated across `navbar.tsx` and `footer.tsx`.
 *
 * The trade-off: `Footer` was a server component so it would ship no client
 * JavaScript, and rendering it from a client component makes it part of the
 * client bundle. It is ~20 lines of static markup next to React, Next's router
 * and the auth provider, which is a cheaper price than a second navigation on
 * one screen or a `:has()` selector hiding global chrome.
 *
 * Named to match its siblings in this folder, which are lower-case.
 */
const DASHBOARD = "/dashboard";

export const Chrome = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();

  if (pathname === DASHBOARD) return <>{children}</>;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
};