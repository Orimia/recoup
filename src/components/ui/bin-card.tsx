import { Card, CardBody } from "@/components/ui/card";
import { Badge, Dot } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, timeAgo } from "@/lib/utils";
import type { Bin } from "@/lib/data/bins";
import { binStatusLabel, locationTypeLabel } from "@/lib/data/bins";

const statusToneMap = {
  online: "brand",
  full: "amber",
  service: "slate",
  offline: "rose",
} as const;

export function BinCard({ bin, className }: { bin: Bin; className?: string }) {
  const tone = statusToneMap[bin.status];
  return (
    <Card className={cn("transition-colors hover:border-line-strong", className)}>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4 font-medium">
              {locationTypeLabel(bin.locationType)}
            </div>
            <div className="mt-0.5 font-display font-semibold text-[14px] text-ink leading-tight">
              {bin.name}
            </div>
          </div>
          <Badge tone={tone}>
            <Dot tone={tone} />
            {binStatusLabel(bin.status)}
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <Progress
            value={bin.fillPct}
            tone={bin.fillPct > 90 ? "amber" : "brand"}
            label="Fill level"
          />

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-4">Today</div>
              <div className="numeric font-semibold text-[15px] mt-0.5">{bin.todayReturns}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-4">7-day</div>
              <div className="numeric font-semibold text-[15px] mt-0.5">
                {bin.weekReturns.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-4">Contam.</div>
              <div className="numeric font-semibold text-[15px] mt-0.5">
                {(bin.contaminationRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line text-[11px] text-ink-4">
            <span>Uptime {(bin.uptime * 100).toFixed(1)}%</span>
            <span>Last event {timeAgo(bin.lastEventMinutesAgo)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
