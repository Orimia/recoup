import Link from "next/link";
import {
  Recycle,
  LineChart,
  Sparkles,
  Target,
  ShieldCheck,
  ArrowUpRight,
  Leaf,
  Building2,
  Eye,
  Truck,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Badge, Dot } from "@/components/ui/badge";
import {
  pilotImpactToday,
  vanderbiltWithAthleticsAnnual,
  networkAnnual,
  IMPACT_CONSTANTS,
} from "@/lib/data/impact";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils";

export default function Landing() {
  return (
    <div className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-70" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24">
          <div className="flex items-center gap-2 mb-6">
            <Badge tone="brand">
              <Dot tone="brand" />
              Vanderbilt pilot · live now
            </Badge>
            <Badge tone="neutral">Recoup · Cleantech · AI</Badge>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] text-ink max-w-4xl">
            Every can,
            <br />
            <span className="text-brand">verified, rewarded, learned from.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ink-3 max-w-2xl leading-relaxed">
            VandyLoop turns campus recycling into verified behavior, measurable outcomes, and
            optimized operations. Built by Recoup. Piloting at Vanderbilt.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-brand text-white text-[15px] font-medium hover:bg-brand-2 transition-colors shadow-sm"
            >
              Join the challenge
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-ink text-paper text-[15px] font-medium hover:bg-ink-2 transition-colors"
            >
              See the live bracket
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full text-ink-3 text-[15px] font-medium hover:text-ink transition-colors"
            >
              Watch the 90-second demo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* hero impact ribbon */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
            <HeroStat
              label="Cans recovered"
              value={formatCompact(pilotImpactToday.cans)}
              sublabel="projected at full-campus scale"
            />
            <HeroStat
              label="Resale value"
              value={formatCurrency(pilotImpactToday.resaleUsd, 0)}
              sublabel="aluminum market"
            />
            <HeroStat
              label="CO₂e avoided"
              value={`${pilotImpactToday.co2eTons.toFixed(1)} t`}
              sublabel="vs virgin production"
            />
            <HeroStat
              label="Active students"
              value={formatCompact(3742)}
              sublabel="projected at full-campus scale"
            />
          </div>
          <p className="mt-4 text-[12px] text-ink-4">
            Figures projected at full-campus adoption. The pilot is live now, try it above.
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <Section className="py-20">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 items-start">
          <div className="sticky top-28">
            <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
              The problem
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
              Universities fly blind on recycling behavior.
            </h2>
            <p className="mt-4 text-[15px] text-ink-3 leading-relaxed">
              Static bins give zero verification, zero feedback, zero dataset. Reverse vending
              machines cost <span className="numeric font-medium text-ink-2">$15–30K</span> per
              unit and need deposit-return laws to pencil out. Sustainability teams report ESG
              using guesses.
            </p>
          </div>

          <div className="grid gap-4">
            <ProblemItem
              Icon={Eye}
              title="No verification"
              body="Contamination is invisible until a hauler flags it at the back of a truck. Nobody knows what's in the bin until it's too late."
            />
            <ProblemItem
              Icon={Target}
              title="No feedback loop"
              body="Reward programs run unmeasured. Signage is installed and forgotten. There's no way to test what works."
            />
            <ProblemItem
              Icon={Truck}
              title="No operational signal"
              body="Service routes run on fixed weekly schedules regardless of fill. Haulers drive empty bins. Overflow happens during events."
            />
            <ProblemItem
              Icon={LineChart}
              title="No ESG credibility"
              body="Sustainability reports use volumetric estimates. Auditors want verified, source-attributed data. The gap is real money."
            />
          </div>
        </div>
      </Section>

      {/* DIFFERENCE */}
      <section className="border-y border-line bg-white py-20">
        <Section>
          <div className="max-w-3xl mb-12">
            <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
              Why VandyLoop is different
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
              Not a bin. A verified-behavior data layer, wrapped in operations.
            </h2>
            <p className="mt-4 text-[15px] text-ink-3 leading-relaxed">
              The bin is a trojan horse. The product is a dataset no one else has: student-level,
              timestamped, verified recycling events, and the AI layer that turns it into
              decisions operators can act on before the next hauler trip.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <DiffCard
              Icon={ShieldCheck}
              title="Verified event, not a guess"
              body="Every deposit tied to a VandyID tap, a sensor event, and a classifier confidence score. The record is defensible to an ESG auditor."
              metric="99.6% sensor uptime"
            />
            <DiffCard
              Icon={Sparkles}
              title="AI that makes decisions, not slides"
              body="Behavior prediction + incentive bandits + contamination vision + service-route forecasting, running continuously, not once a quarter."
              metric="5 models in production"
            />
            <DiffCard
              Icon={Building2}
              title="Scales to a campus, then a network"
              body="Software-on-commodity-hardware. One campus of 120 locations for the cost of four RVMs. Data layer standardizes across campuses."
              metric="~1/10 cost of RVM"
            />
          </div>
        </Section>
      </section>

      {/* HOW AI WORKS */}
      <Section className="py-20">
        <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
          The AI stack
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
          Four models, one closed loop.
        </h2>
        <p className="mt-4 text-[15px] text-ink-3 leading-relaxed max-w-2xl">
          Every return through the system teaches every other decision. This is what a
          $100M-revenue cleantech company looks like at the data layer.
        </p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AiStackCard
            num="01"
            title="Vision · Contamination"
            body="ResNet-50 fine-tuned on 14K campus-labeled samples. Flags coffee cups, hybrid bottles, residual liquid."
            foot="3.7% false-positive rate"
          />
          <AiStackCard
            num="02"
            title="Bandit · Incentives"
            body="Thompson-sampling bandit running instant-reward variants against raffle baseline. Auto-allocates to winners."
            foot="22% lift on first-return"
            highlight
          />
          <AiStackCard
            num="03"
            title="Forecast · Service"
            body="Temporal CNN predicts per-bin fill curves 72 hours out. Triggers dispatch + reroutes on anomaly."
            foot="~$11K/yr per-campus savings"
          />
          <AiStackCard
            num="04"
            title="Segmentation · Behavior"
            body="Clusters students by return motivation. Halftime-spiker, first-timer, regular, each gets different nudges."
            foot="4 active cohorts"
          />
        </div>
      </Section>

      {/* PILOT */}
      <section className="border-y border-line bg-brand-wash/60 py-20">
        <Section>
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
                The pilot
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
                Vanderbilt · 60-day pilot · starting at Munchie Mart.
              </h2>
              <p className="mt-4 text-[15px] text-ink-3 leading-relaxed max-w-xl">
                Narrow wedge: aluminum cans, highest resale per unit, concentrated traffic. Expand
                into dining halls and athletics venues during the pilot. Target aluminum recovery
                50–60% by day 60, up from the ~21% national baseline.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                <Badge tone="brand">8 pilot bins live</Badge>
                <Badge tone="brand">3,742 active students</Badge>
                <Badge tone="amber">0.11 avg reward / return</Badge>
                <Badge tone="slate">48 → 60% target recovery</Badge>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] bg-white border border-line p-6 shadow-[var(--shadow-sm)]">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-semibold mb-3">
                Pilot footprint projection
              </div>
              <div className="space-y-4">
                <ProjectionRow
                  label="Munchie Mart only"
                  cans="≈ 110K / yr"
                  value="$1.9K resale"
                  active
                />
                <ProjectionRow
                  label="Vanderbilt full campus"
                  cans="≈ 1.05M / yr"
                  value={`${formatCurrency(vanderbiltWithAthleticsAnnual.resaleUsd)} resale`}
                />
                <ProjectionRow
                  label="+ Athletics venues"
                  cans="≈ 3.4M / yr"
                  value="$75K–200K total value"
                />
                <ProjectionRow
                  label="Multi-campus network (25)"
                  cans={`≈ ${formatCompact(networkAnnual.cans)} / yr`}
                  value={`${formatCurrency(networkAnnual.resaleUsd + networkAnnual.esgReportingUsd)}+ total value`}
                />
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* IMPACT — show your work */}
      <Section className="py-20">
        <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
          Quantified impact
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] max-w-3xl">
          Every number, computed not claimed.
        </h2>
        <p className="mt-4 text-[15px] text-ink-3 max-w-2xl">
          Hover any tile to see the formula. Every impact number is derived from event-level data +
          published aluminum recycling economics, not extrapolated estimates.
        </p>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ImpactTile
            label="Aluminum recovered"
            value={`${((pilotImpactToday.cans * IMPACT_CONSTANTS.canWeightKg) / 1000).toFixed(2)} t`}
            formula={`${formatNumber(pilotImpactToday.cans)} cans × ${IMPACT_CONSTANTS.canWeightG}g / 1000`}
            icon={<Recycle className="h-4 w-4" />}
          />
          <ImpactTile
            label="Landfill cost avoided"
            value={formatCurrency(pilotImpactToday.landfillAvoidedUsd)}
            formula={`cans × $${IMPACT_CONSTANTS.landfillCostAvoidedUsdPerCan}/can tipping avoided`}
            icon={<Truck className="h-4 w-4" />}
          />
          <ImpactTile
            label="CO₂e avoided"
            value={`${pilotImpactToday.co2eTons.toFixed(1)} t`}
            formula={`cans × ${IMPACT_CONSTANTS.co2eKgPerCanRecycled} kgCO₂e/can (EPA)`}
            icon={<Leaf className="h-4 w-4" />}
          />
          <ImpactTile
            label="ESG reporting value"
            value={formatCurrency(pilotImpactToday.esgReportingUsd)}
            formula="Replaces manual audit + volumetric estimation"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </div>

        <div className="mt-6 text-[12px] text-ink-4 font-mono">
          Formulas: EPA aluminum emissions factor (9.3 kgCO₂e per kg Al recycled vs virgin),
          LME aluminum spot × 0.95 recycled discount, CAA §609 reporting cost benchmarks.
        </div>
      </Section>

      {/* DE-RISKING STRATEGY — how the pilot actually starts */}
      <section className="border-y border-line bg-white py-20">
        <Section>
          <div className="max-w-3xl mb-12">
            <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-3">
              How we start, without touching campus systems
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1]">
              Earn trust before we touch a card reader.
            </h2>
            <p className="mt-4 text-[15px] text-ink-3 leading-relaxed">
              Integrating directly with VandyID and meal money on day one is a security and
              liability minefield, student PII and real balances on the line. So we don&apos;t.
              We launch a standalone challenge with our own points, funded by Vanderbilt. We prove
              the behavior loop works on real students first. Integration is a later, optional step
              taken from a position of evidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <PhaseCard
              num="Phase 1 · now"
              title="Standalone challenge"
              live
              body="Our own web app and points economy. Students sign up, log sensor-verified returns, compete in a dorm bracket, and win Vanderbilt-funded prizes. Zero campus-system access. Zero money at risk."
              foot="Live in this build → /challenge"
            />
            <PhaseCard
              num="Phase 2 · proven"
              title="Operational data layer"
              body="The challenge generates the verified-behavior dataset no campus has: who recycles, where, when, how clean. Sustainability ops gets real ESG-grade numbers and routing insight."
              foot="Live in the private operator console"
            />
            <PhaseCard
              num="Phase 3 · optional"
              title="Deeper integration"
              body="Only once it's working and trusted: tie rewards into existing meal-money rails, add hardware where ROI is proven. A deliberate decision, not a leap of faith."
              foot="Earned, not assumed"
            />
          </div>
        </Section>
      </section>

      {/* CTA */}
      <section className="bg-ink text-paper py-16">
        <Section className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              The challenge is live. Join it.
            </h3>
            <p className="mt-2 text-paper-3 max-w-xl text-[15px]">
              Create an account, pick your dorm or org, and log your first AI-verified return.
              Watch your team climb the bracket in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/join"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-paper text-ink text-[15px] font-medium hover:bg-paper-2 transition-colors"
            >
              Join the challenge
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-paper-3/30 text-paper text-[15px] font-medium hover:bg-paper/5 transition-colors"
            >
              Watch the demo
            </Link>
          </div>
        </Section>
      </section>
    </div>
  );
}

function PhaseCard({
  num,
  title,
  body,
  foot,
  live,
}: {
  num: string;
  title: string;
  body: string;
  foot: string;
  live?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border p-6 ${
        live ? "border-brand bg-brand-wash/50 shadow-[0_0_0_3px_rgba(30,91,70,0.06)]" : "border-line bg-paper-2"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono text-ink-4">{num}</span>
        {live && <Badge tone="brand"><Dot tone="brand" />live</Badge>}
      </div>
      <div className="font-display font-semibold text-[16px] tracking-tight text-ink">{title}</div>
      <p className="mt-2 text-[13px] text-ink-3 leading-relaxed">{body}</p>
      <div className="mt-4 pt-3 border-t border-line text-[11px] font-medium text-brand">{foot}</div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-ink-4">{label}</div>
      <div className="mt-1 font-display text-3xl md:text-4xl font-semibold tracking-tight numeric">
        {value}
      </div>
      <div className="text-[12px] text-ink-4 mt-0.5">{sublabel}</div>
    </div>
  );
}

function ProblemItem({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 p-5 rounded-[var(--radius)] bg-white border border-line">
      <div className="h-9 w-9 rounded-full bg-paper-2 text-ink-2 grid place-items-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display font-semibold text-[15px] text-ink">{title}</div>
        <p className="mt-1 text-[14px] text-ink-3 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function DiffCard({
  Icon,
  title,
  body,
  metric,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  metric: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-paper-2 p-6 hover:border-line-strong transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-full bg-brand text-white grid place-items-center shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <Badge tone="neutral">{metric}</Badge>
      </div>
      <div className="font-display font-semibold text-[16px] text-ink tracking-tight">{title}</div>
      <p className="mt-2 text-[14px] text-ink-3 leading-relaxed">{body}</p>
    </div>
  );
}

function AiStackCard({
  num,
  title,
  body,
  foot,
  highlight,
}: {
  num: string;
  title: string;
  body: string;
  foot: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius)] border p-5 ${
        highlight
          ? "bg-brand text-white border-brand"
          : "bg-white text-ink border-line"
      }`}
    >
      <div className={`text-[11px] font-mono ${highlight ? "text-brand-soft" : "text-ink-4"}`}>
        {num}
      </div>
      <div className="mt-3 font-display font-semibold text-[15px] tracking-tight">{title}</div>
      <p className={`mt-2 text-[13px] leading-relaxed ${highlight ? "text-brand-soft/95" : "text-ink-3"}`}>
        {body}
      </p>
      <div
        className={`mt-4 pt-3 border-t text-[11px] font-medium ${
          highlight ? "border-brand-2 text-white" : "border-line text-ink-3"
        }`}
      >
        {foot}
      </div>
    </div>
  );
}

function ProjectionRow({
  label,
  cans,
  value,
  active,
}: {
  label: string;
  cans: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[var(--radius-sm)] px-3 py-2.5 ${
        active ? "bg-brand-wash border border-brand-soft" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {active && <Dot tone="brand" />}
        <span className={`text-[13px] ${active ? "text-brand font-medium" : "text-ink-3"}`}>
          {label}
        </span>
      </div>
      <div className="text-right">
        <div className="numeric font-semibold text-[13px] text-ink">{cans}</div>
        <div className="text-[11px] text-ink-4">{value}</div>
      </div>
    </div>
  );
}

function ImpactTile({
  label,
  value,
  formula,
  icon,
}: {
  label: string;
  value: string;
  formula: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="group rounded-[var(--radius)] border border-line bg-white p-5 hover:border-line-strong transition-colors"
      title={formula}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-8 rounded-full bg-brand-wash text-brand grid place-items-center">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-ink-4 font-medium group-hover:text-ink-3">
          ƒ
        </span>
      </div>
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-medium">{label}</div>
      <div className="mt-1 font-display text-[28px] font-semibold tracking-tight numeric">
        {value}
      </div>
      <div className="mt-3 pt-3 border-t border-line text-[11px] text-ink-4 font-mono leading-snug">
        {formula}
      </div>
    </div>
  );
}
