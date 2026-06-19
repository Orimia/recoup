"use client";

import { useAppStore, type Scale } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const options: { key: Scale; label: string; hint: string }[] = [
  { key: "pilot", label: "Vanderbilt · Pilot", hint: "8 bins · 60-day pilot" },
  { key: "campus", label: "Vanderbilt · Full campus", hint: "~120 bins · annual" },
  { key: "network", label: "Multi-campus network", hint: "25 campuses · annual" },
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
      <div className="mx-auto max-w-7xl px-6 h-11 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[12px] text-ink-4">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span className="font-medium text-ink-3">Scale view:</span>
          <span className="hidden sm:inline">{options.find((o) => o.key === scale)?.hint}</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-paper-2 border border-line">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => setScale(o.key)}
              className={cn(
                "px-3 h-7 rounded-full text-[12px] font-medium transition-colors",
                scale === o.key ? "bg-white text-ink shadow-sm" : "text-ink-4 hover:text-ink"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
