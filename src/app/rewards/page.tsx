"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Check, Loader2, Coffee, Ticket, Shirt, TreePine, Wallet } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/section";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/challenge/useAuth";

type Reward = {
  id: string;
  name: string;
  cost: number;
  description: string;
  sponsor: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "rw-coffee": Coffee,
  "rw-meal": Wallet,
  "rw-tee": Shirt,
  "rw-tickets": Ticket,
  "rw-tree": TreePine,
};

export default function RewardsPage() {
  const { user, setAuth, refresh } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rewards")
      .then((r) => r.json())
      .then((j) => setRewards(j.rewards ?? []))
      .catch(() => {});
  }, []);

  async function redeem(reward: Reward) {
    setBusyId(reward.id);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not redeem.");
        return;
      }
      setAuth(json.user, null);
      await refresh();
      setToast(`Redeemed: ${reward.name}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Rewards store"
        title="Turn cans into real perks."
        subtitle="Recycle 5+ verified cans to unlock perks, and climb the leaderboard for the season's prize pool. Funded by Vanderbilt and campus partners, no card linked, no money at risk."
        actions={
          user ? (
            <Badge tone="brand">
              <Wallet className="h-3 w-3" />
              {user.points.toLocaleString()} points available
            </Badge>
          ) : (
            <Link
              href="/join"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-2"
            >
              Join to earn
            </Link>
          )
        }
      />

      <Section className="py-8">
        {error && (
          <div className="mb-4 rounded-[var(--radius-sm)] bg-rose-wash border border-rose-soft text-rose text-[13px] px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((rw) => {
            const Icon = ICONS[rw.id] ?? Gift;
            const affordable = user ? user.points >= rw.cost : false;
            const pct = user ? Math.min(100, (user.points / rw.cost) * 100) : 0;
            return (
              <Card key={rw.id} className="flex flex-col">
                <CardBody className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-full bg-brand-wash text-brand grid place-items-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge tone="neutral">{rw.cost.toLocaleString()} pts</Badge>
                  </div>
                  <h3 className="font-display text-[16px] font-semibold tracking-tight text-ink">
                    {rw.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed flex-1">
                    {rw.description}
                  </p>
                  <div className="mt-3 text-[11px] text-ink-4 flex items-center gap-1.5">
                    <Dot tone="brand" />
                    {rw.sponsor}
                  </div>

                  {user && !affordable && (
                    <div className="mt-3">
                      <Progress value={pct} tone="brand" />
                      <div className="mt-1 text-[11px] text-ink-4 numeric">
                        {user.points.toLocaleString()} / {rw.cost.toLocaleString()} ·{" "}
                        {Math.max(0, rw.cost - user.points).toLocaleString()} to go
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => redeem(rw)}
                    disabled={!user || !affordable || busyId === rw.id}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-full text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-ink text-paper hover:bg-ink-2 enabled:bg-brand enabled:hover:bg-brand-2"
                  >
                    {busyId === rw.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : !user ? (
                      "Sign in to redeem"
                    ) : affordable ? (
                      <>
                        <Gift className="h-4 w-4" />
                        Redeem
                      </>
                    ) : (
                      "Keep recycling"
                    )}
                  </button>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-[12px] text-ink-4 max-w-2xl">
          Redeeming spends your balance but never touches your lifetime points, your leaderboard
          standing and your team&apos;s bracket position stay intact.
        </p>
      </Section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onAnimationComplete={() => setTimeout(() => setToast(null), 2600)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2 px-4 h-11 rounded-full bg-ink text-paper text-[13px] font-medium shadow-lg"
          >
            <Check className="h-4 w-4 text-brand-soft" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
