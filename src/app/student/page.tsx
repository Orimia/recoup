"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Smartphone,
  Check,
  Flame,
  Trophy,
  Leaf,
  Recycle,
  ArrowRight,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { studentActivity, studentSnapshot } from "@/lib/data/events";
import { formatCurrency } from "@/lib/utils";

type FlowStep = "idle" | "tap" | "deposit" | "reward";

export default function StudentPage() {
  const [step, setStep] = useState<FlowStep>("idle");

  const reset = () => setStep("idle");
  const next = () => {
    if (step === "idle") setStep("tap");
    else if (step === "tap") setStep("deposit");
    else if (step === "deposit") setStep("reward");
    else reset();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Student experience"
        title="Tap. Drop. Earn. Repeat."
        subtitle="The whole student loop is three taps. We kept the UI boring on purpose, recycling is the habit, not the app."
        actions={
          <Badge tone="brand">
            <Dot tone="brand" />
            VandyID integrated · no app install
          </Badge>
        }
      />

      <Section className="py-10">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          {/* Phone mock with flow */}
          <div className="flex justify-center">
            <div className="w-[320px] shrink-0">
              <div className="relative aspect-[9/19] rounded-[44px] bg-ink p-3 shadow-xl">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-6 w-32 rounded-full bg-ink-2" />
                <div className="h-full w-full rounded-[34px] bg-paper overflow-hidden flex flex-col">
                  <div className="h-8 shrink-0 bg-paper-2 border-b border-line flex items-center justify-center">
                    <div className="text-[10px] text-ink-4 font-mono">VandyLoop</div>
                  </div>
                  <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                      {step === "idle" && <ScreenIdle key="idle" />}
                      {step === "tap" && <ScreenTap key="tap" />}
                      {step === "deposit" && <ScreenDeposit key="deposit" />}
                      {step === "reward" && <ScreenReward key="reward" />}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  onClick={next}
                  className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2"
                >
                  {step === "idle"
                    ? "Start flow"
                    : step === "reward"
                    ? "Replay"
                    : "Next step"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={reset}
                  className="text-[13px] text-ink-4 hover:text-ink h-11 px-3"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Student dashboard view */}
          <div className="space-y-5">
            <Card>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-medium">
                      Your loop
                    </div>
                    <div className="font-display text-[22px] font-semibold tracking-tight">
                      {studentSnapshot.name}
                    </div>
                    <div className="text-[12px] text-ink-4 font-mono">{studentSnapshot.handle}</div>
                  </div>
                  <Badge tone="brand">
                    <Flame className="h-3 w-3" />
                    {studentSnapshot.streakDays}-day streak
                  </Badge>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <MiniStat
                    icon={<Recycle className="h-3.5 w-3.5" />}
                    label="Returns"
                    value={studentSnapshot.semesterReturns.toString()}
                    sub="this semester"
                  />
                  <MiniStat
                    icon={<DollarSign className="h-3.5 w-3.5" />}
                    label="Earned"
                    value={formatCurrency(studentSnapshot.semesterEarnings, 2)}
                    sub="meal money"
                  />
                  <MiniStat
                    icon={<Leaf className="h-3.5 w-3.5" />}
                    label="CO₂e"
                    value={`${studentSnapshot.co2eKgSaved} kg`}
                    sub="avoided"
                  />
                </div>
                <div className="mt-6 p-4 rounded-[var(--radius-sm)] bg-brand-wash border border-brand-soft">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] font-semibold text-brand">
                      Next milestone · {studentSnapshot.nextMilestone.label}
                    </div>
                    <Trophy className="h-4 w-4 text-brand" />
                  </div>
                  <Progress
                    value={studentSnapshot.nextMilestone.progress}
                    max={studentSnapshot.nextMilestone.goal}
                    tone="brand"
                  />
                  <div className="mt-2 text-[11px] text-brand font-mono">
                    {studentSnapshot.nextMilestone.progress} of{" "}
                    {studentSnapshot.nextMilestone.goal} returns · 2 more to unlock
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recent activity</CardTitle>
                  <CardSubtitle>Last 5 returns · verified + rewarded</CardSubtitle>
                </div>
                <Badge tone="neutral">Rank #{studentSnapshot.rank} of {studentSnapshot.totalStudents.toLocaleString()}</Badge>
              </CardHeader>
              <CardBody className="divide-y divide-line">
                {studentActivity.map((a, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand text-white grid place-items-center">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink font-medium truncate">{a.location}</div>
                      <div className="text-[11px] text-ink-4">{a.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="numeric font-semibold text-[13px] text-brand">{a.reward}</div>
                      <div className="text-[10px] text-ink-4">streak {a.streak}</div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <div className="text-[12px] text-ink-4 leading-relaxed">
              <Sparkles className="inline h-3 w-3 text-brand mr-1" />
              The app layer is deliberately minimal. Rewards land on the existing VandyID meal-money
              balance so adoption doesn&apos;t require students to install anything new.
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <div className="mt-1 numeric font-semibold text-[20px] tracking-tight text-ink">{value}</div>
      <div className="text-[11px] text-ink-4">{sub}</div>
    </div>
  );
}

const screenAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

function ScreenIdle() {
  return (
    <motion.div
      {...screenAnim}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="h-16 w-16 rounded-full bg-brand text-white grid place-items-center">
        <Recycle className="h-7 w-7" />
      </div>
      <div className="mt-4 font-display text-[20px] font-semibold text-ink">Tap to deposit</div>
      <div className="mt-1 text-[12px] text-ink-4 max-w-[200px]">
        Hold your VandyID to the reader to start
      </div>
      <div className="mt-6 text-[10px] uppercase tracking-wider text-ink-4 font-mono">
        Munchie Mart · Main
      </div>
    </motion.div>
  );
}

function ScreenTap() {
  return (
    <motion.div
      {...screenAnim}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-brand-wash"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0.6 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="h-20 w-20 rounded-full bg-brand text-white grid place-items-center"
      >
        <Smartphone className="h-8 w-8" />
      </motion.div>
      <div className="mt-4 font-display text-[18px] font-semibold text-brand">VandyID detected</div>
      <div className="mt-1 text-[12px] text-brand/80">Welcome back, Haonan.</div>
      <div className="mt-6 w-full rounded-full bg-white/80 p-1.5">
        <div className="text-[11px] text-brand font-medium">Drop a can to verify</div>
      </div>
    </motion.div>
  );
}

function ScreenDeposit() {
  return (
    <motion.div
      {...screenAnim}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-ink-4 font-semibold mb-3">
        Verifying · vision model
      </div>
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        className="h-24 w-16 rounded-md bg-gradient-to-b from-[#c0c0c0] to-[#a8a8a8] border border-[#888] shadow-md"
      />
      <div className="mt-4 text-[12px] text-ink-3">Aluminum can · 99.4% confident</div>
      <div className="mt-4 w-full">
        <Progress value={78} tone="brand" />
      </div>
      <div className="mt-2 text-[10px] font-mono text-ink-4">
        weight · sensor · vision → match
      </div>
    </motion.div>
  );
}

function ScreenReward() {
  return (
    <motion.div
      {...screenAnim}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-paper-2"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="h-20 w-20 rounded-full bg-brand text-white grid place-items-center shadow-lg"
      >
        <Check className="h-9 w-9" strokeWidth={3} />
      </motion.div>
      <div className="mt-4 font-display text-[22px] font-semibold text-ink">+ $0.10</div>
      <div className="mt-1 text-[12px] text-ink-3">Meal money · posted instantly</div>
      <div className="mt-6 w-full rounded-[var(--radius-sm)] bg-white border border-line p-3">
        <div className="text-[10px] uppercase tracking-wider text-ink-4 font-medium mb-1">
          Streak extended
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber" />
          <span className="font-display text-[18px] font-semibold numeric">8 days</span>
        </div>
      </div>
      <div className="mt-3 text-[10px] text-ink-4 font-mono">
        Event verified · logged · impact recorded
      </div>
    </motion.div>
  );
}
