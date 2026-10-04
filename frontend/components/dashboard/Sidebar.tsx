"use client";

import { Home, Route, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * The 88px floating navigation rail.
 *
 * Fixed width, vertically centred content, and the avatar pushed to the bottom with
 * `mt-auto` so it sits on the rail's floor rather than under the links.
 *
 * The design specified four items - Home, My rides, Wallet, Profile - with Wallet
 * and Profile explicitly visual-only. They are not here: this app has no `/wallet`
 * or `/profile` route, and a nav item that navigates nowhere is a defect in a
 * working product, not a placeholder. Wallet top-ups are Phase 6 and can be added
 * when there is something behind them.
 */
export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/rides", label: "My rides", icon: Route },
  ];

  const initials =
    user?.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") ?? "";

  return (
    <aside className="sticky top-6 h-[calc(100vh-3rem)] w-[88px] shrink-0 flex-col items-center rounded-[28px] border border-ink/7 bg-white/92 py-[26px] shadow-[0_18px_50px_color-mix(in_oklab,var(--color-ink)_6%,transparent)] max-[700px]:hidden">
      <Link
        href="/dashboard"
        aria-label="Dhaka Tesla Pool home"
        title="Dhaka Tesla Pool"
        className="grid size-11 place-items-center rounded-[15px] border border-mint/25 bg-mint/13 text-forest"
      >
        <Zap size={19} strokeWidth={2.5} />
      </Link>

      <nav aria-label="Main" className="mt-10 flex flex-col gap-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active ? "page" : undefined}
              className={[
                "grid size-[46px] place-items-center rounded-[15px] transition duration-200",
                "hover:-translate-y-0.5 hover:bg-ink/5 hover:text-forest",
                active
                  ? "bg-forest text-paper shadow-[0_8px_20px_color-mix(in_oklab,var(--color-forest)_22%,transparent)] hover:bg-forest hover:text-paper"
                  : "text-forest/42",
              ].join(" ")}
            >
              <Icon size={19} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Link
          href="/dashboard"
          aria-label="Open profile"
          title={user?.name ?? "Profile"}
          className="grid size-[42px] place-items-center rounded-full border border-forest/12 bg-forest/6 font-display text-[11px] font-bold text-forest"
        >
          {initials}
        </Link>
      </div>
    </aside>
  );
};