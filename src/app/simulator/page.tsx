"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sliders,
  Recycle,
  DollarSign,
  Leaf,
  Truck,
  Users,
  Zap,
  RefreshCcw,
} from "lucide-react";
import { PageHeader, Section, SectionHeader } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  computeScenario,
  defaultInputs,
  presets,
  type ScenarioInputs,
} from "@/lib/data/scenarios";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/utils";

const LOCATION_OPTIONS: { key: ScenarioInputs["locationType"]; label: string; sub: string }[] = [
  { key: "retail", label: "Retail", sub: "Munchie Mart style" },
  { key: "dining", label: "Dining", sub: "Rand / Commons" },
  { key: "athletics", label: "Athletics", sub: "Stadium · arena" },
  { key: "mixed", label: "Mixed", sub: "Full campus blend" },
];

export default function SimulatorPage() {
  const [inputs, setInputs] = useState<ScenarioInputs>(defaultInputs);
  const outputs = useMemo(() => computeScenario(inputs), [inputs]);

  const update = <K extends keyof ScenarioInputs>(k: K, v: ScenarioInputs[K]) =>
    setInputs((prev) => ({ ...prev, [k]: v }));

  const applyPreset = (name: keyof typeof presets) => setInputs(presets[name]);

  return (
    <div>
      <PageHeader
        eyebrow="Pilot scenario simulator"
        title="Model any campus footprint in real time."
        subtitle="Move the sliders. Every output number is computed from the same math we use internally — no hidden multipliers."
        actions={
          <div className="flex items-center gap-2">
            {Object.keys(presets).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p as keyof typeof presets)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-line-strong text-[12px] font-medium text-ink hover:bg-paper-2"
              >
                {p === "pilot" && "Pilot"}
                {p === "fullCampus" && "Full campus"}
                {p === "network" && "25-campus network"}
              </button>
            ))}
            <button
              onClick={() => setInputs(defaultInputs)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12px] font-medium text-ink-4 hover:text-ink"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        }
      />

      <Section className="py-8">
        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Controls */}
          <Card className="self-start sticky top-28">
            <CardHeader>
              <div>
                <CardTitle>
                  <Sliders className="inline h-4 w-4 mr-1.5 text-brand" />
                  Inputs
                </CardTitle>
                <CardSubtitle>Deterministic model · recomputes instantly</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <RangeInput
                label="Number of bins"
                value={inputs.numBins}
                min={1}
                max={300}
                step={1}
                onChange={(v) => update("numBins", v)}
                unit={inputs.numBins === 1 ? "bin" : "bins"}
              />

              <div>
                <InputLabel label="Location type" />
                <div className="grid grid-cols-2 gap-2">
                  {LOCATION_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => update("locationType", o.key)}
                      className={`rounded-[var(--radius-sm)] border p-2 text-left transition-colors ${
                        inputs.locationType === o.key
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-ink border-line hover:border-line-strong"
                      }`}
                    >
                      <div className="text-[12px] font-semibold">{o.label}</div>
                      <div
                        className={`text-[10px] ${
                          inputs.locationType === o.key ? "text-brand-soft" : "text-ink-4"
                        }`}
                      >
                        {o.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <RangeInput
                label="Student adoption"
                value={Math.round(inputs.adoptionPct * 100)}
                min={5}
                max={85}
                step={1}
                onChange={(v) => update("adoptionPct", v / 100)}
                unit="%"
              />

              <RangeInput
                label="Reward per return"
                value={inputs.rewardCents}
                min={0}
                max={25}
                step={1}
                onChange={(v) => update("rewardCents", v)}
                unit="¢"
              />

              <RangeInput
                label="Contamination rate"
                value={Math.round(inputs.contaminationPct * 1000) / 10}
                min={0}
                max={20}
                step={0.5}
                onChange={(v) => update("contaminationPct", v / 100)}
                unit="%"
              />

              <RangeInput
                label="Number of campuses"
                value={inputs.numCampuses}
                min={1}
                max={50}
                step={1}
                onChange={(v) => update("numCampuses", v)}
                unit={inputs.numCampuses === 1 ? "campus" : "campuses"}
              />

              <ToggleInput
                label="Sports venue mode"
                sub="Halftime reward boost · 2.4× athletics traffic"
                value={inputs.sportsMode}
                onChange={(v) => update("sportsMode", v)}
              />
            </CardBody>
          </Card>

          {/* Outputs */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <OutputTile
                icon={<Recycle className="h-4 w-4" />}
                label="Cans recovered / year"
                value={formatCompact(outputs.cansPerYear)}
                sub={`≈ ${formatNumber(Math.round(outputs.cansPerYear / 365))}/day across fleet`}
                primary
              />
              <OutputTile
                icon={<DollarSign className="h-4 w-4" />}
                label="Aluminum resale"
                value={formatCurrency(outputs.resaleUsd)}
                sub="LME spot × 0.95 recycled"
              />
              <OutputTile
                icon={<Leaf className="h-4 w-4" />}
                label="CO₂e avoided"
                value={`${outputs.co2eTons.toFixed(1)} t`}
                sub="vs virgin production"
              />
              <OutputTile
                icon={<Truck className="h-4 w-4" />}
                label="Landfill cost avoided"
                value={formatCurrency(outputs.landfillAvoidedUsd)}
                sub="tipping + hauler space"
              />
              <OutputTile
                icon={<Users className="h-4 w-4" />}
                label="Students engaged"
                value={formatCompact(outputs.studentsEngaged)}
                sub={`${Math.round(outputs.recoveryRate * 100)}% recovery rate`}
              />
              <OutputTile
                icon={<Zap className="h-4 w-4" />}
                label="Energy saved"
                value={`${formatCompact(outputs.energyKwh)} kWh`}
                sub={`≈ ${formatCompact(outputs.energyKwh / 10500)} US homes/year`}
              />
            </div>

            {/* Total value headline */}
            <Card className="bg-ink text-paper border-ink">
              <CardBody className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.12em] text-paper-3 font-semibold mb-2">
                    Total annual value created
                  </div>
                  <motion.div
                    key={outputs.totalValueUsd}
                    initial={{ opacity: 0.4, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-[48px] md:text-[64px] font-semibold tracking-tight numeric leading-none"
                  >
                    {formatCurrency(outputs.totalValueUsd)}
                  </motion.div>
                  <div className="mt-2 text-[13px] text-paper-3">
                    Resale + landfill + ESG reporting + hauler savings.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
                  <InlineRow label="Resale value" value={formatCurrency(outputs.resaleUsd)} />
                  <InlineRow
                    label="Landfill avoided"
                    value={formatCurrency(outputs.landfillAvoidedUsd)}
                  />
                  <InlineRow
                    label="ESG reporting"
                    value={formatCurrency(outputs.esgReportingUsd)}
                  />
                  <InlineRow
                    label="Hauler savings"
                    value={formatCurrency(outputs.haulerCostSavedUsd)}
                  />
                </div>
              </CardBody>
            </Card>

            <SectionHeader
              eyebrow="Scenario logic"
              title="How this number was computed"
              subtitle="This is not magic. These are the same formulas on the landing page."
            />
            <Card>
              <CardBody>
                <div className="font-mono text-[12px] text-ink-3 leading-relaxed space-y-2">
                  <div>
                    cans/year = bins × baseline({inputs.locationType}) × 365 × adoption-lift(
                    {Math.round(inputs.adoptionPct * 100)}%) × reward-mult({inputs.rewardCents}¢) ×
                    sports-mult({inputs.sportsMode ? "on" : "off"}) × (1 − contamination)
                  </div>
                  <div>resale = cans × $0.0179 (LME spot × 0.95 recycled discount)</div>
                  <div>CO₂e = cans × 0.139 kgCO₂e (EPA aluminum emissions factor)</div>
                  <div>
                    ESG reporting = base × log₁₀(cans / 1000 + 1) × √campuses (capped @ $250K)
                  </div>
                  <div>
                    hauler savings = bins × campuses × 20 trips × $215 (forecast-optimized routes)
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <InputLabel label={label} />
        <span className="numeric text-[13px] font-semibold text-ink">
          {value}
          {unit && <span className="ml-1 text-[11px] text-ink-4 font-normal">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-paper-3 accent-brand"
      />
    </div>
  );
}

function InputLabel({ label }: { label: string }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-semibold">
      {label}
    </span>
  );
}

function ToggleInput({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[13px] font-medium text-ink">{label}</div>
        {sub && <div className="text-[11px] text-ink-4 mt-0.5">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`h-6 w-11 shrink-0 rounded-full transition-colors relative ${
          value ? "bg-brand" : "bg-paper-3"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function OutputTile({
  icon,
  label,
  value,
  sub,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Card className={primary ? "border-brand shadow-[0_0_0_3px_rgba(30,91,70,0.08)]" : ""}>
      <CardBody>
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`h-7 w-7 rounded-full grid place-items-center ${
              primary ? "bg-brand text-white" : "bg-brand-wash text-brand"
            }`}
          >
            {icon}
          </div>
          {primary && <Badge tone="brand">primary</Badge>}
        </div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium">{label}</div>
        <motion.div
          key={value}
          initial={{ opacity: 0.5, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-1 font-display text-[28px] font-semibold tracking-tight numeric text-ink"
        >
          {value}
        </motion.div>
        <div className="mt-1.5 text-[11px] text-ink-4 leading-snug">{sub}</div>
      </CardBody>
    </Card>
  );
}

function InlineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-paper-3">{label}</span>
      <span className="numeric font-semibold text-paper">{value}</span>
    </div>
  );
}
