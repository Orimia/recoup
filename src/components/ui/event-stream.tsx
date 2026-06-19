"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { seedEvents, type LiveEvent } from "@/lib/data/events";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function makeRandomEvent(id: string): LiveEvent {
  const users = ["@jmorales", "@kpatel14", "@achoi", "@sbrooks", "@rlao", "@tnovak", "@dfields", "@mgarza", "@bkim", "@lchen", "@zwu", "@rtaylor"];
  const bins = [
    "Munchie Mart · Main",
    "Rand Dining · North",
    "Rand Dining · South",
    "Munchie Mart · Patio",
    "Towers Residence · Lobby",
    "Stevenson Center · Atrium",
  ];
  const contaminated = Math.random() < 0.06;
  return {
    id,
    t: 0,
    user: users[Math.floor(Math.random() * users.length)],
    binName: bins[Math.floor(Math.random() * bins.length)],
    material: contaminated ? "contaminant" : "aluminum",
    confidence: contaminated ? 0.78 + Math.random() * 0.18 : 0.975 + Math.random() * 0.022,
    reward: contaminated ? "—" : "$0.10",
  };
}

export function EventStream({ max = 6, intervalMs = 2200 }: { max?: number; intervalMs?: number }) {
  const [events, setEvents] = useState<LiveEvent[]>(seedEvents.slice(0, max));

  useEffect(() => {
    let counter = 1000;
    const id = setInterval(() => {
      counter += 1;
      const next = makeRandomEvent(`e-live-${counter}`);
      setEvents((prev) => [next, ...prev].slice(0, max));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, max]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-2 w-2 rounded-full bg-brand pulse-dot" />
        <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-ink-3">
          Live event stream
        </span>
      </div>
      <ol className="space-y-1.5">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] border text-[13px]",
                e.material === "aluminum"
                  ? "bg-brand-wash/60 border-brand-soft"
                  : "bg-amber-wash border-amber-soft"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full",
                  e.material === "aluminum" ? "bg-brand text-white" : "bg-amber text-white"
                )}
              >
                {e.material === "aluminum" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
              </span>
              <span className="font-mono text-[12px] text-ink-4 w-16 shrink-0">{e.user}</span>
              <span className="text-ink-3 flex-1 truncate">{e.binName}</span>
              <span className="numeric text-[11px] text-ink-4 hidden sm:block">
                {(e.confidence * 100).toFixed(1)}%
              </span>
              <span
                className={cn(
                  "numeric font-semibold w-12 text-right",
                  e.material === "aluminum" ? "text-brand" : "text-amber"
                )}
              >
                {e.reward}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}
