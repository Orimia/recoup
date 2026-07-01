"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Recycle,
  Flame,
  Trophy,
  Camera,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  QrCode,
  X,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Mail,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { useAuth } from "@/lib/challenge/useAuth";
import type { Bin, Material, RecentDeposit } from "@/lib/challenge/types";
import { cn, formatClock } from "@/lib/utils";

type DepositResult = {
  material: Material;
  confidence: number;
  classifiedBy: "ai" | "heuristic";
  contaminants: string[];
  pointsAwarded: number;
  binName: string;
  note: string;
  flags: string[];
  trust: number;
  distanceM: number | null;
};

type GeoState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ok"; lat: number; lng: number }
  | { status: "denied" };

function distM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)));
}

export default function ChallengePage() {
  const { user, stats, loading, setAuth, refresh } = useAuth();
  const [bins, setBins] = useState<Bin[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [binCode, setBinCode] = useState("");
  const [scanned, setScanned] = useState<{ lat: number; lng: number } | null>(null);
  const [codeInput, setCodeInput] = useState(""); // pre-filled in demo, typed in strict
  const [strict, setStrict] = useState(false);
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // verify-email banner
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bins")
      .then((r) => r.json())
      .then((j) => {
        setBins(j.bins ?? []);
        setAiEnabled(Boolean(j.aiEnabled));
        setStrict(Boolean(j.strict));
        if (j.bins?.[0]) setBinCode(j.bins[0].code);
      })
      .catch(() => {});
  }, []);

  // Simulate scanning the bin's QR: fetch the bin's coords and (in demo mode) its
  // current rotating code. In strict mode the code is withheld — you type what the
  // physical bin shows — so we leave the input empty for manual entry.
  useEffect(() => {
    if (!binCode) return;
    let active = true;
    fetch(`/api/bin-code?bin=${encodeURIComponent(binCode)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active || j.error) return;
        setScanned({ lat: j.lat, lng: j.lng });
        setCodeInput(j.code ?? "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [binCode]);

  // Distance is derived during render (no effect, no stored state).
  const liveDistance =
    geo.status === "ok" && scanned ? distM(geo.lat, geo.lng, scanned.lat, scanned.lng) : null;

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeo({ status: "denied" });
      return;
    }
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: "ok", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo({ status: "denied" }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large (max 5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function logReturn() {
    if (!binCode) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          binCode,
          code: codeInput || undefined,
          image: image ?? undefined,
          lat: geo.status === "ok" ? geo.lat : undefined,
          lng: geo.status === "ok" ? geo.lng : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not log that return.");
        setBusy(false);
        return;
      }
      setResult(json.deposit);
      setAuth(json.user, json.stats ?? null);
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setVerifyMsg("Sending…");
    setVerifyLink(null);
    try {
      const res = await fetch("/api/auth/resend", { method: "POST" });
      const j = await res.json();
      if (j.alreadyVerified) {
        setVerifyMsg("Already verified.");
        refresh();
        return;
      }
      if (j.devLink) {
        setVerifyMsg("Dev mode: no email provider configured. Use this link:");
        setVerifyLink(j.devLink);
      } else {
        setVerifyMsg("Verification email sent. Check your inbox.");
      }
    } catch {
      setVerifyMsg("Could not send. Try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 grid place-items-center px-6 py-24">
        <Card className="max-w-md text-center">
          <CardBody className="py-10">
            <div className="h-12 w-12 rounded-full bg-brand text-white grid place-items-center mx-auto mb-4">
              <Trophy className="h-5 w-5" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Join the challenge to play
            </h2>
            <p className="mt-2 text-[14px] text-ink-3">
              Create an account, pick your team, and start logging verified returns.
            </p>
            <Link
              href="/join"
              className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2"
            >
              Join the challenge
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={`Competing for ${user.teamName}`}
        title={`Hey ${user.name.split(" ")[0]}, keep the loop going.`}
        subtitle="Tap a VandyLoop bin, drop your can, and earn verified points for your team. Top recyclers win the season's prizes."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand">
              <Flame className="h-3 w-3" />
              {user.streakDays}-day streak
            </Badge>
            <LogoutButton />
          </div>
        }
      />

      <Section className="py-8">
        {/* Verify-email banner */}
        {!user.emailVerified && (
          <div className="mb-6 rounded-[var(--radius)] border border-amber-soft bg-amber-wash p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Mail className="h-4 w-4 text-amber shrink-0" />
              <div className="flex-1 min-w-0 text-[13px] text-ink">
                <span className="font-semibold">Verify your email to redeem rewards.</span>{" "}
                You can earn points now, but redemption needs a confirmed{" "}
                <span className="font-mono">@vanderbilt.edu</span> address.
              </div>
              <button
                onClick={resendVerification}
                className="h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-2"
              >
                Send verification link
              </button>
            </div>
            {verifyMsg && (
              <div className="mt-2 text-[12px] text-ink-3">
                {verifyMsg}{" "}
                {verifyLink && (
                  <a href={verifyLink} className="text-brand font-medium underline break-all">
                    {verifyLink}
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatTile label="Points balance" value={user.points} accent />
          <StatTile label="Lifetime points" value={user.lifetimePoints} />
          <StatTile label="Total returns" value={user.deposits} />
          <StatTile
            label="Your rank"
            value={stats ? `#${stats.rankOverall}` : "—"}
            sub={stats ? `of ${stats.totalStudents} students` : ""}
          />
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          {/* Log a return */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Log a return</CardTitle>
                <CardSubtitle>
                  {aiEnabled
                    ? "Photos verified by Claude vision; presence verified by bin code + location."
                    : "Verified by the bin's sensors and your tap (this web build simulates the bin sensor)."}
                </CardSubtitle>
              </div>
              <Badge tone={aiEnabled ? "brand" : "slate"}>
                <Dot tone={aiEnabled ? "brand" : "slate"} />
                {aiEnabled ? "AI vision live" : "AI vision: sim"}
              </Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-semibold flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  Bin
                </span>
                <select
                  value={binCode}
                  onChange={(e) => setBinCode(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-[var(--radius-sm)] border border-line bg-white text-[14px] focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                >
                  {bins.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} · {b.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="000000"
                    className="w-28 h-9 px-3 rounded-[var(--radius-sm)] border border-line bg-white text-[14px] font-mono tracking-widest text-center focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                  />
                  <span className="text-[11px] text-ink-4">
                    {strict
                      ? "Type the 6-digit code shown on the bin (rotates every 90s)."
                      : "Code from the bin QR · rotates every 90s (anti-share)."}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Location check
                </span>
                <div className="mt-1">
                  <GeoControl
                    geo={geo}
                    distanceM={liveDistance}
                    onUse={useMyLocation}
                    radiusOk={150}
                  />
                </div>
              </div>

              {/* Photo */}
              <div>
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-semibold flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Photo (optional)
                </span>
                <div className="mt-1">
                  {image ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="Deposit preview"
                        className="h-28 w-28 object-cover rounded-[var(--radius-sm)] border border-line"
                      />
                      <button
                        onClick={() => {
                          setImage(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-ink text-paper grid place-items-center"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="h-24 w-full rounded-[var(--radius-sm)] border border-dashed border-line-strong bg-paper-2 grid place-items-center text-ink-4 hover:border-brand hover:text-brand transition-colors"
                    >
                      <span className="flex flex-col items-center gap-1 text-[12px]">
                        <Camera className="h-5 w-5" />
                        Add a photo of your can
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onPickPhoto}
                    className="hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-[var(--radius-sm)] bg-rose-wash border border-rose-soft text-rose text-[13px] px-3 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={logReturn}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-brand text-white text-[14px] font-medium hover:bg-brand-2 transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  <>
                    <Recycle className="h-4 w-4" />
                    Log verified return
                  </>
                )}
              </button>

              <AnimatePresence>{result && <ResultCard result={result} />}</AnimatePresence>
            </CardBody>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Your recent returns</CardTitle>
                <CardSubtitle>
                  {stats ? `${stats.todayDeposits} today · +${stats.todayPoints} pts today` : "—"}
                </CardSubtitle>
              </div>
              <Link href="/leaderboard" className="text-[13px] text-brand font-medium hover:underline">
                Leaderboard →
              </Link>
            </CardHeader>
            <CardBody>
              {stats && stats.recent.length > 0 ? (
                <ul className="divide-y divide-line">
                  {stats.recent.map((d) => (
                    <ActivityRow key={d.id} d={d} />
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center text-[13px] text-ink-4">
                  No returns yet. Log your first one, it only takes a tap.
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
                <span className="text-[12px] text-ink-4">Cash points in for rewards</span>
                <Link
                  href="/rewards"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Rewards store
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        <button
          onClick={() => refresh()}
          className="mt-6 text-[12px] text-ink-4 hover:text-ink transition-colors"
        >
          Refresh stats
        </button>
      </Section>
    </div>
  );
}

function GeoControl({
  geo,
  distanceM,
  onUse,
  radiusOk,
}: {
  geo: GeoState;
  distanceM: number | null;
  onUse: () => void;
  radiusOk: number;
}) {
  if (geo.status === "ok") {
    const near = distanceM !== null && distanceM <= radiusOk;
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[12px] border",
          near ? "bg-brand-wash border-brand-soft text-brand" : "bg-amber-wash border-amber-soft text-amber"
        )}
      >
        {near ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
        {distanceM !== null
          ? near
            ? `At the bin (~${distanceM} m). Presence verified.`
            : `~${distanceM} m away, move closer for full trust.`
          : "Location captured."}
      </div>
    );
  }
  if (geo.status === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[12px] border bg-paper-2 border-line text-ink-4">
        <ShieldAlert className="h-4 w-4" />
        Location unavailable, deposit will be logged but flagged unverified.
      </div>
    );
  }
  return (
    <button
      onClick={onUse}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] border border-line-strong text-ink text-[13px] font-medium hover:bg-paper-2"
    >
      {geo.status === "locating" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="h-4 w-4" />
      )}
      Verify I&apos;m at the bin
    </button>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-brand shadow-[0_0_0_3px_rgba(30,91,70,0.08)]" : ""}>
      <CardBody className="py-4">
        <div className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-medium">{label}</div>
        <div
          className={cn(
            "mt-1 font-display text-[26px] font-semibold tracking-tight numeric",
            accent ? "text-brand" : "text-ink"
          )}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-[11px] text-ink-4 mt-0.5">{sub}</div>}
      </CardBody>
    </Card>
  );
}

const FLAG_LABEL: Record<string, string> = {
  no_photo: "no photo",
  location_unverified: "location unverified",
  geofence_fail: "too far from bin",
  bad_bin_code: "bad bin code",
  duplicate_image: "duplicate photo",
  rate_burst: "too fast",
};

function ResultCard({ result }: { result: DepositResult }) {
  const good = result.material === "aluminum" && result.pointsAwarded > 0;
  const flagged = result.material !== "aluminum";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "rounded-[var(--radius)] border p-4",
        good ? "bg-brand-wash border-brand-soft" : "bg-amber-wash border-amber-soft"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-10 w-10 rounded-full grid place-items-center text-white shrink-0",
            good ? "bg-brand" : "bg-amber"
          )}
        >
          {good ? <Check className="h-5 w-5" strokeWidth={3} /> : <AlertTriangle className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="font-display text-[18px] font-semibold tracking-tight text-ink">
            {good ? `+${result.pointsAwarded} points` : flagged ? "Contamination flagged" : "Logged · 0 points"}
          </div>
          <div className="text-[12px] text-ink-3">
            {result.binName} · {(result.confidence * 100).toFixed(1)}% confident ·{" "}
            {result.classifiedBy === "ai" ? "Claude vision" : "classifier"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ink-4 font-semibold">trust</div>
          <div
            className={cn(
              "numeric font-semibold text-[15px]",
              result.trust >= 0.8 ? "text-brand" : result.trust >= 0.5 ? "text-amber" : "text-rose"
            )}
          >
            {Math.round(result.trust * 100)}%
          </div>
        </div>
      </div>
      <div className="mt-2 text-[13px] text-ink-3">{result.note}</div>
      {result.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {result.flags.map((f) => (
            <Badge key={f} tone="amber">
              {FLAG_LABEL[f] ?? f}
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ActivityRow({ d }: { d: RecentDeposit }) {
  const good = d.material === "aluminum" && d.pointsAwarded > 0;
  return (
    <li className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
      <div
        className={cn(
          "h-8 w-8 rounded-full grid place-items-center text-white shrink-0",
          good ? "bg-brand" : "bg-amber"
        )}
      >
        {good ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{d.binName}</div>
        <div className="text-[11px] text-ink-4">
          {formatClock(d.createdAt)} ·{" "}
          {d.classifiedBy === "ai" ? "Claude vision" : "classifier"} · {(d.confidence * 100).toFixed(0)}%
        </div>
      </div>
      <div className={cn("numeric font-semibold text-[14px]", good ? "text-brand" : "text-amber")}>
        {good ? `+${d.pointsAwarded}` : "—"}
      </div>
    </li>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      onClick={() => logout()}
      className="h-9 px-3 rounded-full text-[13px] font-medium text-ink-4 hover:text-ink hover:bg-paper-2 transition-colors"
    >
      Sign out
    </button>
  );
}
