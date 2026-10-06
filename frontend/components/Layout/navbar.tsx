"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
];

const isActivePath = (pathname: string, href: string): boolean =>
  href === "/" ? pathname === href : pathname.startsWith(href);

/**
 * Nav link appearance.
 *
 * daisyUI's `menu-active` is kept in the class list because it is the state hook the
 * element is identified by, but the colours are set explicitly here. Under the Kinetic
 * theme `menu-active` resolves to a full-strength ink fill, which is far too loud for a
 * top bar - the design marks the current screen with a mint wash instead.
 */
const linkClasses = (active: boolean) =>
  active
    ? "rounded-full bg-mint/25 text-forest"
    : "rounded-full text-forest/70 hover:bg-mint/12 hover:text-forest";

/**
 * The shared top navigation.
 *
 * Signed-in users get their role and a sign-out control instead of the sign-in
 * links, which keeps the cookie the single source of truth about who is here.
 * `usePathname` marks the active link so the current screen is obvious without a
 * second click.
 *
 * The bar is translucent over the page canvas - the "glass" in the design's name - with
 * a hairline ink border rather than daisyUI's `base-300`, which is a cool grey and read
 * as blue-grey next to the warm paper.
 */
export const Navbar = () => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/6 bg-white/85 backdrop-blur-md">
      <nav className="navbar mx-auto w-full max-w-5xl px-4 py-3">
        <div className="flex-1">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-forest"
          >
            Dhaka Tesla Pool
          </Link>
        </div>
        <ul className="menu menu-horizontal gap-1 px-0">
          {isLoading || !user ? (
            LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`font-display text-sm font-semibold transition-colors ${linkClasses(
                    isActivePath(pathname, link.href),
                  )}`}
                  aria-current={
                    isActivePath(pathname, link.href) ? "page" : undefined
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))
          ) : (
            <>
              <li>
                <Link
                  href="/dashboard"
                  className={`font-display text-sm font-semibold transition-colors ${linkClasses(
                    isActivePath(pathname, "/dashboard"),
                  )}`}
                  aria-current={
                    isActivePath(pathname, "/dashboard") ? "page" : undefined
                  }
                >
                  {user.role === "driver" ? "Driver home" : "Passenger home"}
                </Link>
              </li>
              {/*
                Rides are a passenger's screen. A driver has no rides to request
                until Phase 3 gives them Tesla registration, so showing the link
                would be offering an empty list.
              */}
              {user.role === "passenger" ? (
                <li>
                  <Link
                    href="/rides"
                    className={`font-display text-sm font-semibold transition-colors ${linkClasses(
                      isActivePath(pathname, "/rides"),
                    )}`}
                    aria-current={
                      isActivePath(pathname, "/rides") ? "page" : undefined
                    }
                  >
                    Rides
                  </Link>
                </li>
              ) : null}
              <li className="self-center">
                {/*
                  The email is the only proof of who is signed in, so it cannot be
                  truncated away on a narrow bar - it wraps under the links instead,
                  which is what `flex-wrap` on the list does at 390px.
                */}
                <span className="rounded-full border border-forest/12 bg-white/70 px-2.5 py-1 text-[10px] font-bold tracking-[.12em] break-all text-forest/70 uppercase">
                  {user.email}
                </span>
              </li>
              <li>
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 font-display text-sm font-semibold text-forest/70 transition hover:bg-mint/12 hover:text-forest"
                  onClick={() => void logout()}
                >
                  Sign out
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};