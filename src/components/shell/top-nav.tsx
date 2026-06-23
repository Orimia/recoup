"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PlayCircle, Trophy, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/challenge/useAuth";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/challenge", label: "Challenge" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/dashboard", label: "Vision" },
];

export function TopNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape (taps close it via each link's onClick).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <Image
            src="/recoup-logo.png"
            alt="Recoup"
            width={245}
            height={245}
            priority
            className="h-9 w-9 shrink-0"
          />
          <div className="leading-tight">
            <div className="font-display text-[15px] font-semibold tracking-tight text-ink">
              <span className="text-brand">Recoup</span>
              <span className="text-ink-4 font-normal"> / VandyLoop</span>
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-3 hover:text-ink hover:bg-paper-2"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {!loading && user ? (
            <Link
              href="/challenge"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-line-strong text-ink text-[13px] font-medium hover:bg-paper-2 transition-colors"
            >
              <Trophy className="h-3.5 w-3.5 text-brand" />
              <span className="font-mono">@{user.handle}</span>
              <span className="text-ink-4">·</span>
              <span className="numeric text-brand font-semibold">{user.points}</span>
            </Link>
          ) : (
            <Link
              href="/join"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full border border-line-strong text-ink text-[13px] font-medium hover:bg-paper-2 transition-colors"
            >
              Join challenge
            </Link>
          )}
          <Link
            href="/demo"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-brand text-white text-[13px] font-medium hover:bg-brand-2 transition-colors shadow-sm"
          >
            <PlayCircle className="h-4 w-4" />
            Demo
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-line-strong text-ink hover:bg-paper-2 transition-colors"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="md:hidden border-t border-line bg-paper/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-2 flex flex-col">
            {nav.map((n) => {
              const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                    active ? "bg-ink text-paper" : "text-ink-3 hover:text-ink hover:bg-paper-2"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
