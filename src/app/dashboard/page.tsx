"use client";

import Link from "next/link";
import {
  Recycle,
  Users,
  AlertTriangle,
  Activity,
  Leaf,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Circle,
} from "lucide-react";
import { PageHeader, Section, SectionHeader } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { BinCard } from "@/components/ui/bin-card";
import { InsightCard } from "@/components/ui/insight-card";
import { EventStream } from "@/components/ui/event-stream";
import { TrendArea, SimpleBar } from "@/components/ui/charts";
import { Progress } from "@/components/ui/progress";
import { ProjectionBanner } from "@/components/ui/projection-banner";
import { bins, pilotKpis } from "@/lib/data/bins";
import { insights, recommendedActions } from "@/lib/data/insights";
import { weeklyTrend, hourlyTrend } from "@/lib/data/trends";
import { pilotImpactToday, recoveryBaseline } from "@/lib/data/impact";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils";

export default function DashboardPage() {
  const topInsights = insights.slice(0, 3);
  const locationPerf = bucketByLocation();

  return (
    <div>
      <ProjectionBanner>
        Projected operations at full-campus scale (~120 bins). Illustrative model, not live pilot data. The live pilot runs in the Challenge and the private operator console.
      </ProjectionBanner>
      <PageHeader
        eyebrow="Vision · projected at full-campus scale"
        title="VandyLoop · operations at scale"
        subtitle="What the operator view looks like at full-campus adoption. Illustrative model, not live pilot data."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="amber">Projected</Badge>
            <Link
              href="/ai"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium text-ink-3 hover:text-ink hover:bg-paper-2"
            >
              View all insights
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        }
      />

      <Section className="py-8 space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiTile
            icon={<Recycle className="h-4 w-4" />}
            label="Returns today"
            value={formatNumber(pilotKpis.returnsToday)}
            delta={+14}
            sublabel="vs 7-day avg"
          />
          <KpiTile
            icon={<Users className="h-4 w-4" />}
            label="Active users today"
            value={formatNumber(pilotKpis.activeUsersToday)}
            delta={+9}
            sublabel="vs yesterday"
          />
          <KpiTile
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Contamination"
            value={`${(pilotKpis.contaminationRate * 100).toFixed(1)}%`}
            delta={-11}
            sublabel="trending down"
            tone="amber"
          />
          <KpiTile
            icon={<Activity className="h-4 w-4" />}
            label="Uptime"
            value={`${(pilotKpis.uptime * 100).toFixed(1)}%`}
            delta={0}
            sublabel="30-day"
          />
          <KpiTile
            icon={<DollarSign className="h-4 w-4" />}
            label="Resale value"
            value={formatCurrency(pilotImpactToday.resaleUsd, 0)}
            delta={+18}
            sublabel="pilot to date"
          />
          <KpiTile
            icon={<Leaf className="h-4 w-4" />}
            label="CO₂e avoided"
            value={`${pilotImpactToday.co2eTons.toFixed(1)} t`}
            delta={+18}
            sublabel="pilot to date"
          />
        </div>

        {/* Top row: participation trend + recycling index */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Participation forecast · 12 weeks rolling</CardTitle>
                <CardSubtitle>
                  Returns are compounding. Model projects 18% week-over-week growth through W+3.
                </CardSubtitle>
              </div>
              <Badge tone="brand">+18% w/w</Badge>
            </CardHeader>
            <CardBody>
              <TrendArea
                data={weeklyTrend}
                xKey="week"
                yKey="returns"
                height={220}
                forecastAfter="W0"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recycling index score</CardTitle>
                <CardSubtitle>Composite of recovery, participation, quality</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[56px] font-semibold tracking-tight numeric text-brand leading-none">
                  {pilotKpis.recyclingIndex}
                </span>
                <span className="text-sm text-ink-4">/ 100</span>
              </div>
              <div className="mt-4 space-y-3">
                <RecoveryRow
                  label="National baseline"
                  pct={recoveryBaseline.withoutVandyLoop * 100}
                  tone="slate"
                />
                <RecoveryRow
                  label="Pilot current"
                  pct={recoveryBaseline.pilotCurrent * 100}
                  tone="brand"
                  active
                />
                <RecoveryRow
                  label="Day-60 target"
                  pct={recoveryBaseline.pilotTarget * 100}
                  tone="amber"
                />
              </div>
              <div className="mt-4 text-[11px] text-ink-4 font-mono border-t border-line pt-3">
                2.3× national university aluminum recovery avg.
              </div>
            </CardBody>
          </Card>
        </div>

        {/* AI insights + event stream */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
          <div>
            <SectionHeader
              eyebrow="AI insights · last 90 min"
              title="Three decisions the system just made"
              subtitle="Generated by models running against live event data. Click any card for reasoning."
            />
            <div className="grid gap-4">
              {topInsights.map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Live event stream</CardTitle>
                  <CardSubtitle>New can deposits as they happen</CardSubtitle>
                </div>
              </CardHeader>
              <CardBody>
                <EventStream max={6} intervalMs={2400} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Recommended actions</CardTitle>
                  <CardSubtitle>Queued from today&apos;s insights</CardSubtitle>
                </div>
                <Badge tone="amber">{recommendedActions.filter((a) => a.status === "pending").length} pending</Badge>
              </CardHeader>
              <CardBody className="divide-y divide-line">
                {recommendedActions.map((a) => (
                  <div key={a.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <Circle
                      className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                        a.status === "in-progress" ? "text-amber fill-amber" : "text-ink-4"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-ink leading-snug">{a.title}</div>
                      <div className="mt-0.5 text-[11px] text-ink-4 flex items-center gap-2">
                        <span>{a.owner}</span>
                        <span className="text-ink-5">·</span>
                        <span className="text-brand font-medium">{a.impact}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Hourly pattern + location comparison */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today · hourly returns</CardTitle>
                <CardSubtitle>Watch for the 1 PM lunch and 5 PM after-class peaks</CardSubtitle>
              </div>
              <Badge tone="brand">1 PM peak</Badge>
            </CardHeader>
            <CardBody>
              <SimpleBar data={hourlyTrend} xKey="hour" yKey="returns" height={180} highlight="1p" />
              <div className="mt-3 text-[12px] text-ink-4">
                Contamination jumps 2.8× after 8 PM — currently open insight.
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Location performance</CardTitle>
                <CardSubtitle>Returns per active user · lower contamination is better</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {locationPerf.map((l) => (
                <div key={l.type}>
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="font-medium text-ink">{l.label}</span>
                    <span className="numeric text-ink-3">
                      {formatCompact(l.returns)} returns ·{" "}
                      <span className={l.contam > 0.08 ? "text-amber" : "text-brand"}>
                        {(l.contam * 100).toFixed(1)}% contam
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={(l.returns / locationPerf[0].returns) * 100}
                    tone={l.contam > 0.08 ? "amber" : "brand"}
                  />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Bin grid */}
        <div>
          <SectionHeader
            eyebrow="Fleet · 8 pilot bins"
            title="Bin status"
            subtitle="Every pilot location at a glance. Tap into any for per-bin event history."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bins.map((b) => (
              <BinCard key={b.id} bin={b} />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

function KpiTile({
  icon,
  label,
  value,
  delta,
  sublabel,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  sublabel?: string;
  tone?: "brand" | "amber";
}) {
  const isPositive = delta !== undefined && delta > 0;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`h-7 w-7 rounded-full grid place-items-center ${
            tone === "amber" ? "bg-amber-wash text-amber" : "bg-brand-wash text-brand"
          }`}
        >
          {icon}
        </div>
        {delta !== undefined && (
          <span
            className={`text-[11px] font-medium numeric inline-flex items-center gap-0.5 ${
              delta > 0 ? "text-brand" : delta < 0 ? (tone === "amber" ? "text-brand" : "text-rose") : "text-ink-4"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${delta < 0 ? "rotate-180" : ""}`}
            />
            {isPositive ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium">{label}</div>
      <div className="mt-1 font-display text-[22px] font-semibold tracking-tight numeric text-ink">
        {value}
      </div>
      {sublabel && <div className="mt-1 text-[11px] text-ink-4">{sublabel}</div>}
    </Card>
  );
}

function RecoveryRow({
  label,
  pct,
  tone,
  active,
}: {
  label: string;
  pct: number;
  tone: "brand" | "amber" | "slate";
  active?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className={active ? "font-semibold text-ink" : "text-ink-3"}>
          {active && <Dot tone="brand" />} {label}
        </span>
        <span className={`numeric font-semibold ${tone === "brand" ? "text-brand" : tone === "amber" ? "text-amber" : "text-ink-3"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <Progress value={pct} tone={tone === "slate" ? "ink" : tone} />
    </div>
  );
}

function bucketByLocation() {
  const byType: Record<string, { returns: number; contam: number; count: number }> = {};
  for (const b of bins) {
    const k = b.locationType;
    if (!byType[k]) byType[k] = { returns: 0, contam: 0, count: 0 };
    byType[k].returns += b.weekReturns;
    byType[k].contam += b.contaminationRate;
    byType[k].count += 1;
  }
  return Object.entries(byType)
    .map(([type, v]) => ({
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      returns: v.returns,
      contam: v.contam / v.count,
    }))
    .sort((a, b) => b.returns - a.returns);
}
