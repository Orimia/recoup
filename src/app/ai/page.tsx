"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  AlertTriangle,
  Truck,
  Activity,
  Sparkles,
  Filter,
  Upload,
  Check,
  X,
  ScanSearch,
} from "lucide-react";
import { PageHeader, Section, SectionHeader } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { InsightCard } from "@/components/ui/insight-card";
import { ProjectionBanner } from "@/components/ui/projection-banner";
import { Badge, Dot } from "@/components/ui/badge";
import { TrendLine } from "@/components/ui/charts";
import { Progress } from "@/components/ui/progress";
import { insights, type InsightKind } from "@/lib/data/insights";
import { rewardExperiment, athleticsPulse } from "@/lib/data/trends";
import { formatPercent } from "@/lib/utils";

const FILTERS: { key: InsightKind | "all"; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All models", icon: <Sparkles className="h-3 w-3" /> },
  { key: "contamination", label: "Vision / contamination", icon: <AlertTriangle className="h-3 w-3" /> },
  { key: "incentive", label: "Incentive bandit", icon: <Sparkles className="h-3 w-3" /> },
  { key: "servicing", label: "Service forecast", icon: <Truck className="h-3 w-3" /> },
  { key: "behavior", label: "Behavior segmenter", icon: <Target className="h-3 w-3" /> },
  { key: "anomaly", label: "Anomaly detector", icon: <Activity className="h-3 w-3" /> },
];

const contaminationSamples = [
  { label: "Aluminum can · verified", verdict: "pass", confidence: 0.994, color: "brand" as const, tint: "#d9e8e0" },
  { label: "Aluminum can · dented", verdict: "pass", confidence: 0.981, color: "brand" as const, tint: "#d9e8e0" },
  { label: "Coffee cup w/ lid", verdict: "reject", confidence: 0.926, color: "amber" as const, tint: "#f4e6d5" },
  { label: "Hybrid plastic bottle", verdict: "reject", confidence: 0.887, color: "amber" as const, tint: "#f4e6d5" },
  { label: "Residual liquid can", verdict: "flag", confidence: 0.73, color: "amber" as const, tint: "#f4e6d5" },
];

export default function AiPage() {
  const [filter, setFilter] = useState<InsightKind | "all">("all");
  const visible = filter === "all" ? insights : insights.filter((i) => i.kind === filter);

  return (
    <div>
      <ProjectionBanner>
        Planned models, shown for illustration. No AI is running yet. The AI layer activates once verified bins generate real data, and that dataset is the moat.
      </ProjectionBanner>
      <PageHeader
        eyebrow="AI roadmap · planned models"
        title="The models that will make VandyLoop a system."
        subtitle="Planned, not live. These are illustrative outputs; the real models train once the bins produce verified events."
        actions={
          <Badge tone="amber">Planned</Badge>
        }
      />

      <Section className="py-8 space-y-10">
        {/* Model fleet */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ModelStatCard
            name="vision-contam/v3"
            desc="ResNet-50 fine-tuned on 14K Vanderbilt samples"
            metric="96.3% accuracy"
            trainedOn="14,200 labels"
            status="planned"
          />
          <ModelStatCard
            name="incentive-bandit/v2"
            desc="Thompson sampling · 4 reward variants"
            metric="+22% first-return lift"
            trainedOn="840 matched users"
            status="planned"
            highlight
          />
          <ModelStatCard
            name="fill-forecast/v1"
            desc="Temporal CNN · 72-hour horizon"
            metric="MAE 6.4% fill"
            trainedOn="14 days × 8 bins"
            status="planned"
          />
          <ModelStatCard
            name="behavior-segmenter/v2"
            desc="Temporal clustering · 4 cohorts"
            metric="89% silhouette"
            trainedOn="6,812 student traces"
            status="planned"
          />
        </div>

        {/* Filters + insights */}
        <div>
          <SectionHeader
            eyebrow="Example output"
            title="Decisions the system would surface"
            subtitle="Filter by model. Every insight would ship with reasoning, confidence, and a recommended action. Illustrative, not live."
            actions={
              <div className="inline-flex items-center gap-1.5 text-[11px] text-ink-4">
                <Filter className="h-3 w-3" />
                {visible.length} insights
              </div>
            }
          />
          <div className="flex flex-wrap gap-2 mb-5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium border transition-colors ${
                  filter === f.key
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink-3 border-line hover:border-line-strong"
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {visible.map((ins) => (
              <InsightCard key={ins.id} insight={ins} />
            ))}
          </div>
        </div>

        {/* Contamination classifier sample grid */}
        <div>
          <SectionHeader
            eyebrow="Vision · contamination"
            title="What the classifier sees in the bin"
            subtitle="Live sample of the last 60 seconds of events, with classifier confidence and verdict."
          />
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {contaminationSamples.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-[var(--radius-sm)] border border-line overflow-hidden bg-white"
                  >
                    <div
                      className="aspect-square grid place-items-center border-b border-line"
                      style={{ backgroundColor: s.tint }}
                    >
                      <ScanSearch
                        className={`h-8 w-8 ${s.color === "brand" ? "text-brand" : "text-amber"}`}
                      />
                    </div>
                    <div className="p-2">
                      <div className="text-[11px] font-medium text-ink truncate">{s.label}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase ${
                            s.verdict === "pass" ? "text-brand" : "text-amber"
                          }`}
                        >
                          {s.verdict === "pass" ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : (
                            <X className="h-2.5 w-2.5" />
                          )}
                          {s.verdict}
                        </span>
                        <span className="numeric text-[10px] text-ink-4">
                          {(s.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-semibold mb-1">
                    Try your own
                  </div>
                  <div className="text-[12px] text-ink-3">
                    Drop an image to simulate a classifier pass. This is a visual mock — the real
                    model runs on sensor-fused inputs.
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-line-strong text-ink text-[13px] font-medium hover:bg-paper-2">
                  <Upload className="h-3.5 w-3.5" />
                  Upload sample
                </button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Incentive experiment + behavior */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Incentive experiment · live bandit</CardTitle>
                <CardSubtitle>Instant reward vs raffle · 12 days · 840 matched students</CardSubtitle>
              </div>
              <Badge tone="brand">94% win probability</Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <ExperimentCohort
                label={rewardExperiment.cohortA.label}
                n={rewardExperiment.cohortA.n}
                firstReturn={rewardExperiment.cohortA.firstReturnRate}
                repeat={rewardExperiment.cohortA.repeatWithin7d}
                contam={rewardExperiment.cohortA.contamination}
                isWinner={false}
              />
              <ExperimentCohort
                label={rewardExperiment.cohortB.label}
                n={rewardExperiment.cohortB.n}
                firstReturn={rewardExperiment.cohortB.firstReturnRate}
                repeat={rewardExperiment.cohortB.repeatWithin7d}
                contam={rewardExperiment.cohortB.contamination}
                isWinner={true}
              />
              <div className="pt-3 border-t border-line text-[12px] text-ink-3 font-mono leading-relaxed">
                Bandit allocated 73% of new traffic to instant-reward variant by day 6 · +22% lift
                on first return · priors weakly informative · 95% CI [12%, 31%]
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Athletics · halftime behavior pulse</CardTitle>
                <CardSubtitle>Post-halftime peak drives 38% of game-night returns</CardSubtitle>
              </div>
              <Badge tone="amber">Reward-boost window 21:25–22:00</Badge>
            </CardHeader>
            <CardBody>
              <TrendLine data={athleticsPulse} xKey="t" yKey="returns" height={160} />
              <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <div className="text-ink-4 uppercase tracking-wider text-[10px] font-semibold">
                    Peak
                  </div>
                  <div className="numeric font-semibold text-ink mt-0.5">21:35 · 167 returns</div>
                </div>
                <div>
                  <div className="text-ink-4 uppercase tracking-wider text-[10px] font-semibold">
                    Next action
                  </div>
                  <div className="text-brand font-medium mt-0.5">
                    2× reward boost during halftime
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Before / after */}
        <div>
          <SectionHeader
            eyebrow="Closing the loop"
            title="Before vs after · what the AI layer actually changed"
            subtitle="Three weeks of pilot data. Each number moved because a model made a call, an operator approved it, and the system re-measured."
          />
          <div className="grid md:grid-cols-3 gap-4">
            <BeforeAfter
              label="Contamination · Munchie Mart evening"
              before="11.8%"
              after="5.6%"
              delta="−6.2pp"
              driver="Vision flagged coffee-cup false positives. Added signage + lighting."
            />
            <BeforeAfter
              label="First-return rate · new students"
              before="38%"
              after="61%"
              delta="+22pp"
              driver="Incentive bandit auto-switched raffle → instant reward allocation."
            />
            <BeforeAfter
              label="Hauler trips · 3 low-volume bins"
              before="3 / wk"
              after="2 / wk"
              delta="−1 trip"
              driver="Fill forecast showed Tue/Fri schedule stays under 85% with 97% probability."
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

function ModelStatCard({
  name,
  desc,
  metric,
  trainedOn,
  status,
  highlight,
}: {
  name: string;
  desc: string;
  metric: string;
  trainedOn: string;
  status: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`${highlight ? "border-brand shadow-[0_0_0_3px_rgba(30,91,70,0.08)]" : ""}`}>
      <CardBody>
        <div className="flex items-center justify-between mb-3">
          <Badge tone={highlight ? "brand" : "neutral"}>
            <Dot tone={highlight ? "brand" : "neutral"} />
            {status}
          </Badge>
          <span className="text-[10px] text-ink-4 font-mono">{trainedOn}</span>
        </div>
        <div className="font-mono text-[12px] text-ink font-medium">{name}</div>
        <div className="mt-1 text-[12px] text-ink-3 leading-relaxed">{desc}</div>
        <div className="mt-3 pt-3 border-t border-line font-display text-[18px] font-semibold tracking-tight numeric text-brand">
          {metric}
        </div>
      </CardBody>
    </Card>
  );
}

function ExperimentCohort({
  label,
  n,
  firstReturn,
  repeat,
  contam,
  isWinner,
}: {
  label: string;
  n: number;
  firstReturn: number;
  repeat: number;
  contam: number;
  isWinner: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-sm)] p-3 border ${
        isWinner ? "bg-brand-wash border-brand-soft" : "bg-paper-2 border-line"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`text-[13px] font-semibold ${isWinner ? "text-brand" : "text-ink"}`}>
          {label}
        </div>
        {isWinner && <Badge tone="brand">Winning</Badge>}
      </div>
      <div className="text-[11px] text-ink-4 mb-3">n = {n} · matched on hall + meal tier</div>
      <div className="grid grid-cols-3 gap-2 text-[12px]">
        <KpiRow label="1st return" value={formatPercent(firstReturn * 100, 0)} />
        <KpiRow label="7d repeat" value={formatPercent(repeat * 100, 0)} />
        <KpiRow label="Contam" value={formatPercent(contam * 100, 1)} />
      </div>
      <div className="mt-3">
        <Progress value={firstReturn * 100} tone={isWinner ? "brand" : "ink"} />
      </div>
    </div>
  );
}

function KpiRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-4">{label}</div>
      <div className="mt-0.5 numeric font-semibold text-[13px] text-ink">{value}</div>
    </div>
  );
}

function BeforeAfter({
  label,
  before,
  after,
  delta,
  driver,
}: {
  label: string;
  before: string;
  after: string;
  delta: string;
  driver: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-semibold mb-2">
          {label}
        </div>
        <div className="flex items-baseline gap-3">
          <div>
            <div className="text-[11px] text-ink-4">Before</div>
            <div className="font-display text-[22px] font-semibold text-ink-3 numeric line-through decoration-ink-5">
              {before}
            </div>
          </div>
          <div className="text-ink-4">→</div>
          <div>
            <div className="text-[11px] text-brand font-medium">After</div>
            <div className="font-display text-[26px] font-semibold text-brand numeric">{after}</div>
          </div>
          <Badge tone="brand" className="ml-auto">
            {delta}
          </Badge>
        </div>
        <div className="mt-3 pt-3 border-t border-line text-[12px] text-ink-3 leading-relaxed">
          {driver}
        </div>
      </CardBody>
    </Card>
  );
}
