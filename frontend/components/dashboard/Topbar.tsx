"use client";

import { ChevronDown, WalletCards } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { formatPoysha } from "@/lib/format";

/**
 * Greeting and TeslaPay balance.
 *
 * The design's copy was "Good evening, Rafi" and a hardcoded ৳ 1,240. Both are
 * real data here: the name comes from the session, and the balance is the
 * integer poysha the API already returns, formatted by the same `formatPoysha`
 * the rest of the app uses so a balance never disagrees with a fare.
 *
 * The greeting is derived from the browser's clock rather than hardcoded to
 * "evening", which would be wrong for every request outside that hour.
 */
const greetingFor = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const Topbar = ({ user }: { user: SessionUser }) => {
  const firstName = user.name.split(" ")[0];

  return (
    <header className="mb-7 flex flex-wrap items-center justify-between gap-6 px-2">
      <div>
        <p className="mb-[5px] text-[10px] font-bold tracking-[.18em] text-forest/55 uppercase">
          Dhaka Tesla Pool
        </p>
        <h1 className="font-display text-[26px] leading-[1.1] font-semibold tracking-normal text-ink max-[700px]:text-[26px]">
          {greetingFor(new Date())}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-forest/50 max-[700px]:hidden">
          Where are you headed today?
        </p>
      </div>

      <div className="flex min-w-[205px] items-center gap-3 rounded-[18px] border border-ink/6 bg-white px-[15px] py-3 shadow-[0_12px_30px_color-mix(in_oklab,var(--color-ink)_5%,transparent)] max-[700px]:min-w-0 max-[700px]:gap-0 max-[700px]:p-2.5">
        <span className="grid size-[37px] place-items-center rounded-[12px] bg-mint/15 text-forest max-[700px]:hidden">
          <WalletCards size={18} />
        </span>
        <div className="max-[700px]:hidden">
          <p className="text-[10px] font-bold tracking-[.08em] text-forest/52 uppercase">
            TeslaPay balance
          </p>
          <p className="mt-0.5 font-display text-[19px] text-forest">
            &#2547; {formatPoysha(user.teslaPayBalancePoysha)}
          </p>
        </div>
        {/*
          Below 700px the label, icon and chevron are hidden, so the amount is the
          only thing left. It moves into the collapsed row and the icon tiles are
          dropped, which is the design's mobile rule.
        */}
        <p className="hidden font-display text-[16px] text-forest max-[700px]:block">
          &#2547; {formatPoysha(user.teslaPayBalancePoysha)}
        </p>
        <ChevronDown size={16} className="ml-auto text-forest/45 max-[700px]:hidden" />
      </div>
    </header>
  );
};