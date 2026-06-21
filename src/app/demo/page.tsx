"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PlayCircle,
  RefreshCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/section";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendArea } from "@/components/ui/charts";
import { weeklyTrend } from "@/lib/data/trends";
import {
  vanderbiltWithAthleticsAnnual,
  networkAnnual,
} from "@/lib/data/impact";
import { formatCompact, formatCurrency } from "@/lib/utils";

type Step = {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  notes: string;
  tone: "ink" | "brand" | "amber";
  label: string;
};

export default function DemoPage() {
  const [idx, setIdx] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const steps = buildSteps();
  const step = steps[idx];
  const atEnd = idx === steps.length - 1;
  const atStart = idx === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Demo mode · 90 seconds"
        title="The whole loop, start to finish."
        subtitle="Eight screens, one narrative. Built for an operator or a sustainability lead."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotes((s) => !s)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-line-strong text-[13px] font-medium text-ink hover:bg-paper-2"
            >
              <FileText className="h-3.5 w-3.5" />
              {showNotes ? "Hide" : "Show"} presenter notes
            </button>
            <button
              onClick={() => setIdx(0)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium text-ink-4 hover:text-ink"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reset demo
            </button>
          </div>
        }
      />

      <Section className="py-8">
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Stage */}
          <div>
            {/* Progress */}
            <div className="mb-4 flex items-center gap-2">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i === idx ? "bg-brand" : i < idx ? "bg-brand-soft" : "bg-paper-3"
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge tone={step.tone === "ink" ? "ink" : step.tone === "amber" ? "amber" : "brand"}>
                  Step {idx + 1} / {steps.length}
                </Badge>
                <span className="text-[13px] text-ink-4 font-mono">{step.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={atStart}
                  className="inline-flex items-center gap-1 h-9 w-9 rounded-full border border-line text-ink-3 hover:bg-paper-2 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))}
                  disabled={atEnd}
                  className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-2 disabled:opacity-30"
                >
                  {atEnd ? "End" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="overflow-hidden">
                  <CardBody className="p-8">
                    <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-2">
                      {step.label}
                    </div>
                    <h2 className="font-display text-[30px] md:text-[36px] font-semibold tracking-tight leading-tight text-ink max-w-3xl">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-[15px] text-ink-3 max-w-2xl leading-relaxed">
                      {step.subtitle}
                    </p>
                    <div className="mt-8">{step.content}</div>
                  </CardBody>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between text-[12px] text-ink-4">
              <div>
                Use ← / → keys (coming soon) or the buttons above. All data seeded for demo.
              </div>
              {atEnd && (
                <button
                  onClick={() => setIdx(0)}
                  className="inline-flex items-center gap-1.5 text-brand font-medium hover:underline"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Restart demo
                </button>
              )}
            </div>
          </div>

          {/* Presenter notes rail */}
          {showNotes && (
            <aside className="self-start sticky top-28">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <PlayCircle className="h-4 w-4 text-brand" />
                    <div className="text-[11px] uppercase tracking-[0.12em] text-brand font-semibold">
                      Presenter notes
                    </div>
                  </div>
                  <div className="text-[13px] text-ink-3 leading-relaxed whitespace-pre-line">
                    {step.notes}
                  </div>
                  <div className="mt-4 pt-4 border-t border-line text-[11px] text-ink-4 font-mono">
                    Step {idx + 1} / {steps.length} · est. {stepTime(idx)}s
                  </div>
                </CardBody>
              </Card>
            </aside>
          )}
        </div>
      </Section>
    </div>
  );
}

function buildSteps(): Step[] {
  return [
    {
      id: "1-problem",
      label: "Problem",
      title: "Universities are flying blind on recycling.",
      subtitle:
        "Static bins. No verification. Reverse vending machines cost $15–30K and need deposit laws. ESG reports are essentially guesses.",
      tone: "ink",
      content: (
        <div className="grid md:grid-cols-3 gap-3">
          {[
            { label: "No verification", body: "What's in the bin is unknown until hauler day." },
            { label: "No feedback loop", body: "Reward programs run blind. Nothing measured." },
            { label: "No operational signal", body: "Fixed-schedule hauler trips. Overflow events." },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-[var(--radius-sm)] border border-line bg-paper-2 p-4"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-rose mb-1">
                {p.label}
              </div>
              <div className="text-[13px] text-ink-3">{p.body}</div>
            </div>
          ))}
        </div>
      ),
      notes:
        "Hook: 'universities recycle about 21% of aluminum nationally. Why? Because they have no idea what's actually in their bins.' Pause. Land the stakes: ESG reports are fiction, hauler trips are wasted, contamination is invisible.",
    },
    {
      id: "2-student",
      label: "Student action",
      title: "A student taps VandyID. Drops a can.",
      subtitle:
        "The only user-facing surface. Three seconds. No app install. Reward lands on existing meal-money balance.",
      tone: "brand",
      content: (
        <div className="grid md:grid-cols-3 gap-4">
          <PhaseCard
            phase="1 · Tap"
            text="Existing VandyID reader detects a tap. We already know who this student is."
            color="#d9e8e0"
          />
          <PhaseCard
            phase="2 · Drop"
            text="Weight + vision + sensor fusion verify aluminum in real time."
            color="#d9e8e0"
          />
          <PhaseCard
            phase="3 · +$0.10"
            text="Reward posts instantly. Streak updates. Ledger writes event."
            color="#d9e8e0"
            highlight
          />
        </div>
      ),
      notes:
        "This is the only screen a student ever sees. Keep the story boring on purpose — the habit is the product, not the app. Mention: we don't ship a new consumer app, we live inside VandyID.",
    },
    {
      id: "3-verified",
      label: "Verified event",
      title: "The classifier runs. Confidence score logged.",
      subtitle:
        "Every deposit writes a verified, attributable event. This is the dataset that doesn't exist anywhere else on a university campus today.",
      tone: "brand",
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          <EventRow
            user="@jmorales"
            bin="Munchie Mart · Main"
            material="aluminum"
            confidence={0.996}
          />
          <EventRow
            user="@kpatel14"
            bin="Rand Dining · North"
            material="aluminum"
            confidence={0.992}
          />
          <EventRow
            user="@rlao"
            bin="Munchie Mart · Main"
            material="contaminant"
            confidence={0.84}
            note="Coffee cup flagged · no reward"
          />
          <EventRow
            user="@achoi"
            bin="Towers Residence"
            material="aluminum"
            confidence={0.988}
          />
        </div>
      ),
      notes:
        "Three things in every event: who, what, how confident. That's all auditors need. That's all Vanderbilt Sustainability needs. That's what static bins can't give them.",
    },
    {
      id: "4-reward",
      label: "Reward issued",
      title: "Bandit decides this student&apos;s next reward.",
      subtitle:
        "Not a flat $0.10. A model trained on 840 matched students allocates the incentive that maximizes return rate for this cohort.",
      tone: "brand",
      content: (
        <div className="rounded-[var(--radius)] bg-brand-wash border border-brand-soft p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-brand font-semibold mb-2">
                Bandit decision · @jmorales
              </div>
              <div className="text-[13px] text-ink-3 leading-relaxed">
                Cohort: regular returner · meal-plan tier A · evening pattern
              </div>
              <div className="mt-4 space-y-2">
                <BanditRow variant="Instant $0.10 meal money" pct={73} winner />
                <BanditRow variant="Raffle entry (weekly $25)" pct={19} />
                <BanditRow variant="Streak bonus only" pct={8} />
              </div>
            </div>
            <div className="bg-white rounded-[var(--radius-sm)] p-4 border border-line">
              <div className="text-[11px] uppercase tracking-wider text-ink-4 font-semibold mb-2">
                Why this decision
              </div>
              <div className="text-[12px] text-ink-3 font-mono leading-relaxed">
                posterior_win_prob(instant) = 0.94
                <br />
                lift_vs_raffle = +22% [95% CI: 12%, 31%]
                <br />
                exploration_rate = ε 0.08 · Thompson
                <br />→ allocate instant · log for A/B
              </div>
            </div>
          </div>
        </div>
      ),
      notes:
        "Call this out: this is Thompson sampling, a standard bandit approach. Not magic. But it's continuous and it compounds. Every reward is a data point. Every data point trains the next decision.",
    },
    {
      id: "5-ai-insight",
      label: "AI insight",
      title: "Minutes later, the system surfaces a decision.",
      subtitle:
        "The operator didn't ask for this. The model ran on live data and produced a recommendation with reasoning.",
      tone: "amber",
      content: (
        <div className="rounded-[var(--radius)] border border-amber-soft bg-amber-wash p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber" />
            <Badge tone="amber">vision-contam/v3</Badge>
            <span className="text-[11px] text-ink-4 font-mono">87% confident</span>
          </div>
          <div className="font-display text-[20px] font-semibold tracking-tight text-ink leading-snug">
            Contamination spikes 18% after 8 PM at Munchie Mart
          </div>
          <div className="mt-2 text-[13px] text-ink-3 leading-relaxed">
            Evening contamination rate climbs to 11.8% vs 4.1% daytime. Classifier confusion
            matrix flags coffee-cup false-positives, correlated with ambient lighting below 180
            lux at the bin station.
          </div>
          <div className="mt-4 pt-4 border-t border-amber-soft space-y-2">
            <div className="flex items-start gap-2 text-[13px]">
              <Dot tone="brand" />
              <span>
                <span className="font-semibold text-ink">Recommend · </span>
                Add secondary lighting + update signage for Munchie Mart evening hours.
              </span>
            </div>
            <div className="flex items-start gap-2 text-[13px]">
              <Dot tone="amber" />
              <span>
                <span className="font-semibold text-ink">Projected · </span>
                −6.2pp evening contamination · $310/mo saved hauler fees.
              </span>
            </div>
          </div>
        </div>
      ),
      notes:
        "This is the magic moment. The model didn't just flag a number — it correlated contamination spikes with ambient lighting, explained it in English, and recommended a $50 lighting upgrade that saves $310/mo. That's the loop working.",
    },
    {
      id: "6-dashboard",
      label: "Operator view",
      title: "The operator opens the dashboard. The numbers moved.",
      subtitle:
        "12 weeks of pilot data. Week-over-week compounding. A single insight flagged ready for action.",
      tone: "ink",
      content: (
        <div>
          <TrendArea
            data={weeklyTrend}
            xKey="week"
            yKey="returns"
            height={200}
            forecastAfter="W0"
          />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            <MiniMetric label="Returns (wk)" value="12,825" delta="+14%" />
            <MiniMetric label="Users (wk)" value="3,742" delta="+9%" />
            <MiniMetric label="Contam" value="5.8%" delta="−11%" />
            <MiniMetric label="Uptime" value="99.6%" delta="+0%" />
          </div>
        </div>
      ),
      notes:
        "Sustainability ops doesn't want another dashboard. They want a dashboard that tells them what changed, why, and what to do. That's the framing to lead with.",
    },
    {
      id: "7-pilot",
      label: "Pilot impact",
      title: "Projected at pilot scale · 8 bins → 120 bins.",
      subtitle:
        "One campus. Full deployment. Every number computed from formulas on the landing page — not pitch-deck math.",
      tone: "brand",
      content: (
        <div className="grid md:grid-cols-4 gap-3">
          <Headline
            label="Cans / year"
            value={formatCompact(vanderbiltWithAthleticsAnnual.cans)}
            sub="full campus + athletics"
          />
          <Headline
            label="Resale + landfill"
            value={formatCurrency(
              vanderbiltWithAthleticsAnnual.resaleUsd +
                vanderbiltWithAthleticsAnnual.landfillAvoidedUsd
            )}
            sub="annual"
          />
          <Headline
            label="CO₂e avoided"
            value={`${vanderbiltWithAthleticsAnnual.co2eTons.toFixed(0)} t`}
            sub="vs virgin Al"
          />
          <Headline
            label="ESG reporting value"
            value={formatCurrency(vanderbiltWithAthleticsAnnual.esgReportingUsd)}
            sub="framework coverage"
          />
        </div>
      ),
      notes:
        "This is the leap. If we extend from the pilot to the full campus, here's what it looks like. Not 'up-to' or 'projected' — computed, using pilot-observed economics.",
    },
    {
      id: "8-network",
      label: "Network scale",
      title: "Now multiply by 25 campuses.",
      subtitle:
        "The platform plays are measurable aluminum recovery + a standardized ESG data layer. This is a real cleantech company.",
      tone: "ink",
      content: (
        <div className="rounded-[var(--radius)] bg-ink text-paper p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-paper-3 font-semibold mb-1">
                Network cans / year
              </div>
              <div className="font-display text-[40px] font-semibold tracking-tight numeric">
                {formatCompact(networkAnnual.cans)}
              </div>
              <div className="text-[12px] text-paper-3">25-campus deployment</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-paper-3 font-semibold mb-1">
                Annual value
              </div>
              <div className="font-display text-[40px] font-semibold tracking-tight numeric text-brand-soft">
                {formatCurrency(
                  networkAnnual.resaleUsd +
                    networkAnnual.landfillAvoidedUsd +
                    networkAnnual.esgReportingUsd
                )}
              </div>
              <div className="text-[12px] text-paper-3">resale + landfill + ESG</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-paper-3 font-semibold mb-1">
                CO₂e avoided
              </div>
              <div className="font-display text-[40px] font-semibold tracking-tight numeric">
                {networkAnnual.co2eTons.toFixed(0)} t
              </div>
              <div className="text-[12px] text-paper-3">annually, network-wide</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-paper-3/20 text-[13px] text-paper-3 max-w-2xl leading-relaxed">
            VandyLoop is the demo. Recoup is the platform: verified-behavior infrastructure for
            the circular economy. Vanderbilt is campus #1.
          </div>
        </div>
      ),
      notes:
        "Close: Vanderbilt is the proving ground. The behavior + verification stack is the defensible asset. Every new campus adds to a dataset no one else has, which makes every subsequent campus work better on arrival. Thank them.",
    },
  ];
}

function PhaseCard({
  phase,
  text,
  color,
  highlight,
}: {
  phase: string;
  text: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-sm)] p-4 border ${
        highlight ? "border-brand bg-brand text-white" : "border-line"
      }`}
      style={highlight ? undefined : { backgroundColor: color }}
    >
      <div
        className={`text-[11px] uppercase tracking-[0.1em] font-semibold mb-2 ${
          highlight ? "text-brand-soft" : "text-brand"
        }`}
      >
        {phase}
      </div>
      <div className={`text-[13px] leading-relaxed ${highlight ? "text-white" : "text-ink"}`}>
        {text}
      </div>
    </div>
  );
}

function EventRow({
  user,
  bin,
  material,
  confidence,
  note,
}: {
  user: string;
  bin: string;
  material: "aluminum" | "contaminant";
  confidence: number;
  note?: string;
}) {
  const good = material === "aluminum";
  return (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-sm)] border p-3 ${
        good ? "bg-brand-wash border-brand-soft" : "bg-amber-wash border-amber-soft"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-full grid place-items-center ${
          good ? "bg-brand text-white" : "bg-amber text-white"
        }`}
      >
        {good ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[12px] text-ink-4">{user}</div>
        <div className="text-[13px] font-medium text-ink truncate">{bin}</div>
        {note && <div className="text-[11px] text-amber mt-0.5">{note}</div>}
      </div>
      <div className="text-right">
        <div
          className={`text-[11px] uppercase tracking-wider font-semibold ${
            good ? "text-brand" : "text-amber"
          }`}
        >
          {material}
        </div>
        <div className="numeric text-[12px] text-ink-4">{(confidence * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
}

function BanditRow({
  variant,
  pct,
  winner,
}: {
  variant: string;
  pct: number;
  winner?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className={winner ? "font-semibold text-brand" : "text-ink-3"}>{variant}</span>
        <span className={`numeric font-semibold ${winner ? "text-brand" : "text-ink-3"}`}>
          {pct}%
        </span>
      </div>
      <Progress value={pct} tone={winner ? "brand" : "ink"} />
    </div>
  );
}

function Headline({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-line p-4 bg-paper-2">
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium">{label}</div>
      <div className="mt-1 font-display text-[24px] font-semibold tracking-tight numeric text-ink">
        {value}
      </div>
      <div className="text-[11px] text-ink-4 mt-0.5">{sub}</div>
    </div>
  );
}

function MiniMetric({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-4">{label}</div>
      <div className="mt-0.5 numeric font-semibold text-[16px]">{value}</div>
      <div className="text-[10px] text-brand font-medium">{delta}</div>
    </div>
  );
}

function stepTime(idx: number) {
  return [10, 12, 12, 14, 14, 12, 10, 10][idx] ?? 10;
}
