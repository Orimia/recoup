"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Flame, Loader2, Crown } from "lucide-react";
import { PageHeader, Section, SectionHeader } from "@/components/ui/section";
import { Card, CardBody, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Individual = {
  rank: number;
  handle: string;
  name: string;
  teamName: string;
  lifetimePoints: number;
  deposits: number;
  streakDays: number;
};
type TeamStanding = {
  id: string;
  name: string;
  type: "dorm" | "org";
  region: string;
  seed: number;
  members: number;
  points: number;
  livePoints: number;
};
type BracketTeam = { name: string; points: number; seed: number } | null;
type BracketMatch = { round: string; a: BracketTeam; b: BracketTeam; winner: "a" | "b" | null };

type Data = {
  individuals: Individual[];
  teams: TeamStanding[];
  bracket: BracketMatch[][];
};

export default function LeaderboardPage() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/leaderboard", { cache: "no-store" })
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 15000); // gentle live refresh
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="flex-1 grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-ink-4" />
      </div>
    );
  }

  const maxTeam = Math.max(...data.teams.map((t) => t.points), 1);
  const champion = data.bracket?.[2]?.[0];
  const championTeam =
    champion && champion.winner ? (champion.winner === "a" ? champion.a : champion.b) : null;

  return (
    <div>
      <PageHeader
        eyebrow="VandyLoop · March Madness recycling challenge"
        title="The bracket is live."
        subtitle="Dorms and orgs seeded by recycling volume. Every verified can moves your team up and earns a raffle entry for the season's prizes."
        actions={
          <Link
            href="/join"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-2"
          >
            Join a team
          </Link>
        }
      />

      <Section className="py-8 space-y-10">
        {/* Season prizes */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-1">
                  Season prizes
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">Recycle to win</h3>
              </div>
              <Badge tone="amber">Funded by Vanderbilt + sponsors</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
              <div className="rounded-[var(--radius-sm)] border border-line bg-paper-2 p-3">
                <div className="font-semibold text-ink">Grand prize</div>
                <div className="text-ink-3 mt-0.5">Weighted raffle: every verified can is one entry</div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-line bg-paper-2 p-3">
                <div className="font-semibold text-ink">2nd place</div>
                <div className="text-ink-3 mt-0.5">Runner-up prize</div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-line bg-paper-2 p-3">
                <div className="font-semibold text-ink">3rd to 5th</div>
                <div className="text-ink-3 mt-0.5">Tiered prizes</div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-line bg-paper-2 p-3">
                <div className="font-semibold text-ink">Everyone</div>
                <div className="text-ink-3 mt-0.5">5+ verified cans unlocks a perk</div>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-ink-4">
              Winning dorm takes the bracket. Points come only from sensor-verified cans, capped per day, so the leaderboard stays fair.
            </p>
          </CardBody>
        </Card>

        {/* Bracket */}
        <div>
          <SectionHeader
            eyebrow="The bracket"
            title="Championship picture"
            subtitle="Seeded by current points. Higher total advances, so recruit your hall and recycle."
            actions={
              championTeam ? (
                <Badge tone="brand">
                  <Crown className="h-3 w-3" />
                  Projected champ · {championTeam.name}
                </Badge>
              ) : undefined
            }
          />
          <Card>
            <CardBody className="overflow-x-auto">
              <div className="flex gap-6 min-w-[680px]">
                <BracketColumn title="Quarterfinals" matches={data.bracket[0]} />
                <BracketColumn title="Semifinals" matches={data.bracket[1]} />
                <BracketColumn title="Final" matches={data.bracket[2]} champion />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Team standings + individuals */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Team standings</CardTitle>
                <CardSubtitle>Baseline funding + every member&apos;s verified points</CardSubtitle>
              </div>
              <Trophy className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardBody className="space-y-3">
              {data.teams.map((t, i) => (
                <div key={t.id}>
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full grid place-items-center text-[11px] font-semibold numeric",
                          i === 0 ? "bg-brand text-white" : "bg-paper-3 text-ink-3"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium text-ink">{t.name}</span>
                      <Badge tone="neutral">
                        {t.region} · {t.seed}
                      </Badge>
                    </span>
                    <span className="numeric font-semibold text-ink">
                      {t.points.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(t.points / maxTeam) * 100} tone={i === 0 ? "brand" : "ink"} />
                  <div className="mt-1 text-[11px] text-ink-4">
                    {t.members} {t.members === 1 ? "member" : "members"} ·{" "}
                    {t.livePoints.toLocaleString()} earned live
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Top recyclers</CardTitle>
                <CardSubtitle>Individual leaderboard · lifetime verified points</CardSubtitle>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-line">
                {data.individuals.map((u) => (
                  <li key={u.handle} className="py-2.5 flex items-center gap-3 first:pt-0 last:pb-0">
                    <span
                      className={cn(
                        "h-6 w-6 rounded-full grid place-items-center text-[11px] font-semibold numeric shrink-0",
                        u.rank === 1
                          ? "bg-brand text-white"
                          : u.rank <= 3
                          ? "bg-brand-soft text-brand"
                          : "bg-paper-3 text-ink-3"
                      )}
                    >
                      {u.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-ink truncate">
                        {u.name} <span className="text-ink-4 font-mono">@{u.handle}</span>
                      </div>
                      <div className="text-[11px] text-ink-4">
                        {u.teamName} · {u.deposits} returns
                      </div>
                    </div>
                    {u.streakDays > 1 && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-amber font-medium">
                        <Flame className="h-3 w-3" />
                        {u.streakDays}
                      </span>
                    )}
                    <span className="numeric font-semibold text-[14px] text-brand w-14 text-right">
                      {u.lifetimePoints.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </Section>
    </div>
  );
}

function BracketColumn({
  title,
  matches,
  champion,
}: {
  title: string;
  matches: BracketMatch[];
  champion?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col justify-around gap-4">
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-semibold">{title}</div>
      {matches.map((m, i) => (
        <MatchCard key={i} match={m} champion={champion} />
      ))}
    </div>
  );
}

function MatchCard({ match, champion }: { match: BracketMatch; champion?: boolean }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-line bg-white overflow-hidden">
      <TeamRow team={match.a} won={match.winner === "a"} />
      <div className="h-px bg-line" />
      <TeamRow team={match.b} won={match.winner === "b"} />
      {champion && match.winner && (
        <div className="bg-brand text-white text-[11px] font-semibold px-2.5 py-1 flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Champion
        </div>
      )}
    </div>
  );
}

function TeamRow({ team, won }: { team: BracketTeam; won: boolean }) {
  if (!team) {
    return <div className="px-2.5 py-2 text-[12px] text-ink-5">TBD</div>;
  }
  return (
    <div
      className={cn(
        "px-2.5 py-2 flex items-center justify-between gap-2",
        won ? "bg-brand-wash" : ""
      )}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        {won && <Dot tone="brand" />}
        <span className="text-[10px] text-ink-4 font-mono">{team.seed}</span>
        <span
          className={cn(
            "text-[12px] truncate",
            won ? "font-semibold text-brand" : "text-ink-3"
          )}
        >
          {team.name}
        </span>
      </span>
      <span className="numeric text-[11px] font-medium text-ink-3">
        {team.points.toLocaleString()}
      </span>
    </div>
  );
}
