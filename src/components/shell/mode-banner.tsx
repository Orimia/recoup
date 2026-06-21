"use client";

import { useAppStore, type Scale } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const options: { key: Scale; label: string; short: string; hint: string }[] = [
  { key: "pilot", label: "Vanderbilt · Pilot", short: "Pilot", hint: "8 bins · 60-day pilot" },
  { key: "campus", label: "Vanderbilt · Full campus", short: "Full campus", hint: "~120 bins · annual" },
  { key: "network", label: "Multi-campus network", short: "Network", hint: "25 campuses · annual" },
];

// The scale toggle is a pitch-narrative control. Hide it on the live product
// routes (the challenge, leaderboard, rewards, operator console, join).
const HIDE_ON = ["/challenge", "/leaderboard", "/rewards", "/admin", "/join"];

export function ModeBanner() {
  const { scale, setScale } = useAppStore();
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-11 py-1.5 flex items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-2 text-[12px] text-ink-4 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span className="font-medium text-ink-3">Scale view:</span>
          <span className="hidden md:inline">{options.find((o) => o.key === scale)?.hint}</span>
        </div>
        <div className="flex w-full items-center justify-between gap-1 p-0.5 rounded-full bg-paper-2 border border-line sm:w-auto sm:justify-start">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setScale(o.key)}
              className={cn(
                "h-7 rounded-full px-2.5 sm:px-3 text-[12px] font-medium whitespace-nowrap transition-colors",
                scale === o.key ? "bg-white text-ink shadow-sm" : "text-ink-4 hover:text-ink"
              )}
            >
              <span className="sm:hidden">{o.short}</span>
              <span className="hidden sm:inline">{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
