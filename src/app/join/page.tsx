"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/challenge/useAuth";
import type { TeamOption } from "@/lib/challenge/types";

type Mode = "signup" | "login";

export default function JoinPage() {
  const router = useRouter();
  const { user, setAuth } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((j) => {
        setTeams(j.teams ?? []);
        if (j.teams?.[0]) setTeamId(j.teams[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) router.replace("/challenge");
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const url = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload =
      mode === "signup"
        ? { name, handle, email, password, teamId, consent }
        : { email, password };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setBusy(false);
        return;
      }
      setAuth(json.user, json.stats ?? null);
      router.push("/challenge");
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 grid lg:grid-cols-2">
      <h1 className="sr-only lg:hidden">Join the VandyLoop recycling challenge</h1>
      {/* Left: pitch */}
      <div className="hidden lg:flex flex-col justify-center px-12 border-r border-line bg-brand-wash/40">
        <div className="max-w-md">
          <Image src="/recoup-logo.png" alt="Recoup" width={245} height={245} priority className="h-11 w-11 mb-6" />
          <h1 className="font-display text-4xl font-semibold tracking-tight leading-[1.1] text-ink">
            Join the VandyLoop March Madness recycling challenge.
          </h1>
          <p className="mt-4 text-[15px] text-ink-3 leading-relaxed">
            Recycle a can, scan the bin, earn points. Compete for your dorm or org in a live
            bracket. Cash points in for coffee, meal money, tickets, and more — funded by
            Vanderbilt.
          </p>
          <ul className="mt-6 space-y-2 text-[14px] text-ink-3">
            <Bullet>Every return is AI-verified, so points are real.</Bullet>
            <Bullet>Your dorm climbs the bracket as you recycle.</Bullet>
            <Bullet>No app to install. No card linked. Just your account.</Bullet>
          </ul>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-1 p-1 rounded-full bg-paper-2 border border-line mb-6 w-fit">
            <TabButton active={mode === "signup"} onClick={() => setMode("signup")}>
              Sign up
            </TabButton>
            <TabButton active={mode === "login"} onClick={() => setMode("login")}>
              Log in
            </TabButton>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-[13px] text-ink-4">
            {mode === "signup"
              ? "Takes 20 seconds. Pick a team to compete for."
              : "Log in to keep your streak alive."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <>
                <Field label="Name">
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Morales"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Handle">
                  <input
                    className={inputCls}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="jmorales"
                    autoComplete="username"
                  />
                </Field>
              </>
            )}
            <Field label="Email">
              <input
                className={inputCls}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@vanderbilt.edu"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <input
                className={inputCls}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </Field>
            {mode === "signup" && (
              <Field label="Compete for">
                <select
                  className={inputCls}
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.region} ({t.type})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {mode === "signup" && (
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                />
                <span className="text-[12px] text-ink-3 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-brand hover:underline">
                    pilot terms &amp; privacy notice
                  </Link>
                  . I understand VandyLoop stores my email, name, and recycling activity for this
                  challenge.
                </span>
              </label>
            )}

            {error && (
              <div className="rounded-[var(--radius-sm)] bg-rose-wash border border-rose-soft text-rose text-[13px] px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full bg-ink text-paper text-[14px] font-medium hover:bg-ink-2 transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signup" ? "Create account & start" : "Log in"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-[12px] text-ink-4">
            Prototype accounts. We store your email + a hashed password only — no card, no campus
            credentials.{" "}
            <Link href="/" className="text-brand hover:underline">
              Back to overview
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-[var(--radius-sm)] border border-line bg-white text-[14px] text-ink placeholder:text-ink-5 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.08em] text-ink-4 font-semibold">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-8 rounded-full text-[13px] font-medium transition-colors ${
        active ? "bg-white text-ink shadow-sm" : "text-ink-4 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
      <span>{children}</span>
    </li>
  );
}
