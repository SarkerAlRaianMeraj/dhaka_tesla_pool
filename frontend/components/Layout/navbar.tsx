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
 * The shared top navigation.
 *
 * Signed-in users get their role and a sign-out control instead of the sign-in
 * links, which keeps the cookie the single source of truth about who is here.
 * `usePathname` marks the active link so the current screen is obvious without a
 * second click.
 */
export const Navbar = () => {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="border-b border-base-300 bg-base-100">
      <nav className="navbar mx-auto w-full max-w-5xl px-4">
        <div className="flex-1">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Dhaka Tesla Pool
          </Link>
        </div>
        <ul className="menu menu-horizontal gap-1 px-0">
          {isLoading || !user ? (
            LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={isActivePath(pathname, link.href) ? "menu-active" : undefined}
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
                  className={isActivePath(pathname, "/dashboard") ? "menu-active" : undefined}
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
                    className={isActivePath(pathname, "/rides") ? "menu-active" : undefined}
                    aria-current={
                      isActivePath(pathname, "/rides") ? "page" : undefined
                    }
                  >
                    Rides
                  </Link>
                </li>
              ) : null}
              <li>
                <span className="badge badge-outline badge-sm self-center">
                  {user.email}
                </span>
              </li>
              <li>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
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