"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCallback } from "react";
import { Loader2, Recycle, Users, AlertTriangle, Gift, Cpu, Activity, Check, ShieldAlert, Ban } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleBar } from "@/components/ui/charts";
import { Progress } from "@/components/ui/progress";
import { cn, formatClock } from "@/lib/utils";

type Totals = {
  students: number;
  verifiedUsers: number;
  deposits: number;
  verified: number;
  contaminant: number;
  contaminationRate: number;
  activeToday: number;
  pointsAwarded: number;
  redemptions: number;
  aiClassified: number;
  flagged: number;
  voided: number;
};
type Flagged = {
  id: string;
  handle: string;
  binName: string;
  pointsAwarded: number;
  trust: number;
  flags: string[];
  createdAt: number;
};
type PerBin = {
  code: string;
  name: string;
  locationType: string;
  total: number;
  contaminationRate: number;
};
type Recent = {
  id: string;
  handle: string;
  binName: string;
  material: "aluminum" | "contaminant" | "other";
  confidence: number;
  classifiedBy: "ai" | "heuristic";
  pointsAwarded: number;
  createdAt: number;
};
type Stats = {
  totals: Totals;
  perBin: PerBin[];
  series: { day: string; label: string; deposits: number }[];
  recent: Recent[];
  flagged: Flagged[];
  aiEnabled: boolean;
};

const FLAG_LABEL: Record<string, string> = {
  no_photo: "no photo",
  location_unverified: "location unverified",
  geofence_fail: "too far from bin",
  bad_bin_code: "bad bin code",
  duplicate_image: "duplicate photo",
  rate_burst: "too fast",
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("vl_admin_key") ?? "" : ""
  );
  const [needsKey, setNeedsKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const load = useCallback(
    () =>
      fetch("/api/admin/stats", {
        cache: "no-store",
        headers: adminKey ? { "x-admin-key": adminKey } : {},
      })
        .then((r) => (r.status === 401 ? Promise.reject("unauth") : r.json()))
        .then((j) => {
          setNeedsKey(false);
          setStats(j);
        })
        .catch((e) => {
          if (e === "unauth") setNeedsKey(true);
        }),
    [adminKey]
  );

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  async function voidDeposit(id: string) {
    setVoiding(id);
    try {
      await fetch("/api/admin/void", {
        method: "POST",
        headers: { "content-type": "application/json", ...(adminKey ? { "x-admin-key": adminKey } : {}) },
        body: JSON.stringify({ depositId: id }),
      });
      await load();
    } finally {
      setVoiding(null);
    }
  }

  function submitKey(e: React.FormEvent) {
    e.preventDefault();
    const k = keyInput.trim();
    if (!k) return;
    if (typeof window !== "undefined") localStorage.setItem("vl_admin_key", k);
    setAdminKey(k); // re-runs load() via dependency
    setNeedsKey(false);
  }

  if (needsKey && !stats) {
    return (
      <div className="flex-1 grid place-items-center px-6 py-24">
        <form onSubmit={submitKey} className="w-full max-w-sm text-center">
          <div className="h-12 w-12 rounded-full bg-ink text-paper grid place-items-center mx-auto mb-4">
            <Cpu className="h-5 w-5" />
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Operator console</h2>
          <p className="mt-2 text-[14px] text-ink-3">
            This dashboard is restricted. Enter the operator key to continue.
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Operator key"
            className="mt-5 w-full h-11 px-3 rounded-[var(--radius-sm)] border border-line bg-white text-[14px] text-center focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <button
            type="submit"
            className="mt-3 w-full h-11 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2"
          >
            Unlock
          </button>
          <p className="mt-3 text-[11px] text-ink-4">Stored on this device only.</p>
        </form>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
      </div>
    );
  }

  const t = stats.totals;
  const maxBin = Math.max(...stats.perBin.map((b) => b.total), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Operator console · live challenge data"
        title="VandyLoop Challenge: live operations"
        subtitle="This console reads the real challenge database: every signup, verified return, and redemption. Pre-launch it shows seeded demo data; live student activity begins at launch. Distinct from the Vision dashboard, which models full-scale projections."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={stats.aiEnabled ? "brand" : "slate"}>
              <Cpu className="h-3 w-3" />
              {stats.aiEnabled ? "Claude vision live" : "Vision: simulated"}
            </Badge>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium text-ink-3 hover:text-ink hover:bg-paper-2"
            >
              Vision dashboard →
            </Link>
          </div>
        }
      />

      <Section className="py-8 space-y-8">
        <div className="flex items-center gap-2 text-[12px] text-ink-4">
          <span className="inline-flex h-2 w-2 rounded-full bg-brand pulse-dot" />
          Auto-refreshing every 8s from <span className="font-mono">/api/admin/stats</span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Kpi icon={<Recycle className="h-4 w-4" />} label="Total returns" value={t.deposits} />
          <Kpi icon={<Check className="h-4 w-4" />} label="Verified" value={t.verified} />
          <Kpi
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Contamination"
            value={`${(t.contaminationRate * 100).toFixed(1)}%`}
            tone="amber"
          />
          <Kpi icon={<Users className="h-4 w-4" />} label="Students" value={t.students} />
          <Kpi icon={<Activity className="h-4 w-4" />} label="Active today" value={t.activeToday} />
          <Kpi icon={<Gift className="h-4 w-4" />} label="Redemptions" value={t.redemptions} />
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          {/* 14-day volume */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Returns · last 14 days</CardTitle>
                <CardSubtitle>Computed from real deposit rows in the challenge store</CardSubtitle>
              </div>
              <Badge tone="brand">{t.pointsAwarded.toLocaleString()} pts awarded</Badge>
            </CardHeader>
            <CardBody>
              <SimpleBar data={stats.series} xKey="label" yKey="deposits" height={200} />
            </CardBody>
          </Card>

          {/* AI mix */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Classification mix</CardTitle>
                <CardSubtitle>How returns were verified</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <MixRow
                label="AI-classified (Claude vision)"
                value={t.aiClassified}
                total={t.deposits}
                tone="brand"
              />
              <MixRow
                label="Heuristic / bin-code"
                value={t.deposits - t.aiClassified}
                total={t.deposits}
                tone="ink"
              />
              <div className="pt-3 border-t border-line text-[12px] text-ink-3 leading-relaxed">
                {stats.aiEnabled
                  ? "Live Claude vision is enabled, uploaded photos are classified by the model."
                  : "No ANTHROPIC_API_KEY set, so classification uses the labeled heuristic. Add a key to switch the same code path to live Claude vision."}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Per-bin + recent feed */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Per-bin activity</CardTitle>
                <CardSubtitle>Volume and contamination by location</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {stats.perBin
                .slice()
                .sort((a, b) => b.total - a.total)
                .map((b) => (
                  <div key={b.code}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="font-medium text-ink">{b.name}</span>
                      <span className="numeric text-ink-3">
                        {b.total} ·{" "}
                        <span className={b.contaminationRate > 0.08 ? "text-amber" : "text-brand"}>
                          {(b.contaminationRate * 100).toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={(b.total / maxBin) * 100}
                      tone={b.contaminationRate > 0.08 ? "amber" : "brand"}
                    />
                  </div>
                ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent returns</CardTitle>
                <CardSubtitle>Live event feed from the database</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-line">
                {stats.recent.map((d) => {
                  const good = d.material === "aluminum";
                  return (
                    <li key={d.id} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full grid place-items-center text-white shrink-0",
                          good ? "bg-brand" : "bg-amber"
                        )}
                      >
                        {good ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-ink truncate">
                          <span className="font-mono text-ink-4">@{d.handle}</span> · {d.binName}
                        </div>
                        <div className="text-[11px] text-ink-4">
                          {formatClock(d.createdAt)} ·{" "}
                          {d.classifiedBy === "ai" ? "Claude vision" : "classifier"} ·{" "}
                          {(d.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <span
                        className={cn(
                          "numeric font-semibold text-[13px]",
                          good ? "text-brand" : "text-amber"
                        )}
                      >
                        {d.pointsAwarded > 0 ? `+${d.pointsAwarded}` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Integrity & fraud review */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <ShieldAlert className="inline h-4 w-4 mr-1.5 text-amber" />
                Integrity & fraud review
              </CardTitle>
              <CardSubtitle>
                Flagged returns from the verification pipeline. Void to claw back points, fully
                reversible because points, not money, are at stake.
              </CardSubtitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="slate">{t.verifiedUsers}/{t.students} verified</Badge>
              <Badge tone="amber">{t.flagged} flagged</Badge>
              {t.voided > 0 && <Badge tone="rose">{t.voided} voided</Badge>}
            </div>
          </CardHeader>
          <CardBody>
            {stats.flagged.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-ink-4">
                No active flags. Clean signal across all returns.
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {stats.flagged.map((f) => (
                  <li key={f.id} className="py-3 flex items-center gap-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-ink">
                        <span className="font-mono text-ink-4">@{f.handle}</span> · {f.binName}{" "}
                        <span className="text-ink-4">· {formatClock(f.createdAt)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {f.flags.map((fl) => (
                          <Badge key={fl} tone="amber">
                            {FLAG_LABEL[fl] ?? fl}
                          </Badge>
                        ))}
                        <span className="text-[11px] text-ink-4">
                          trust {Math.round(f.trust * 100)}% · {f.pointsAwarded} pts
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => voidDeposit(f.id)}
                      disabled={voiding === f.id}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-rose-soft text-rose text-[12px] font-medium hover:bg-rose-wash disabled:opacity-50"
                    >
                      {voiding === f.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                      Void
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </Section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "brand" | "amber";
}) {
  return (
    <Card className="p-4">
      <div
        className={cn(
          "h-7 w-7 rounded-full grid place-items-center mb-3",
          tone === "amber" ? "bg-amber-wash text-amber" : "bg-brand-wash text-brand"
        )}
      >
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium">{label}</div>
      <div className="mt-1 font-display text-[22px] font-semibold tracking-tight numeric text-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </Card>
  );
}

function MixRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "brand" | "ink";
}) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className="text-ink-3">{label}</span>
        <span className="numeric font-semibold text-ink">
          {value.toLocaleString()} · {pct.toFixed(0)}%
        </span>
      </div>
      <Progress value={pct} tone={tone} />
    </div>
  );
}
