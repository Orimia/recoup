import { cn } from "@/lib/utils";
import { Card, CardBody, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, Truck, Activity, Target } from "lucide-react";
import type { Insight, InsightKind } from "@/lib/data/insights";
import { timeAgo } from "@/lib/utils";

const kindMeta: Record<InsightKind, { label: string; tone: "brand" | "amber" | "rose" | "slate"; Icon: React.ComponentType<{ className?: string }> }> = {
  behavior: { label: "Behavior model", tone: "brand", Icon: Target },
  contamination: { label: "Vision / classification", tone: "amber", Icon: AlertTriangle },
  servicing: { label: "Forecast / optimization", tone: "slate", Icon: Truck },
  incentive: { label: "Bandit · A/B", tone: "brand", Icon: Sparkles },
  anomaly: { label: "Anomaly detection", tone: "rose", Icon: Activity },
};

export function InsightCard({
  insight,
  compact = false,
  className,
}: {
  insight: Insight;
  compact?: boolean;
  className?: string;
}) {
  const meta = kindMeta[insight.kind];
  const Icon = meta.Icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardBody className="pt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Badge tone={meta.tone}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </Badge>
          <div className="text-[11px] text-ink-4 numeric">
            {timeAgo(insight.createdMinutesAgo)}
          </div>
        </div>

        <h4 className="font-display text-[15px] md:text-base font-semibold tracking-tight text-ink leading-snug">
          {insight.title}
        </h4>
        <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">{insight.body}</p>

        {!compact && (
          <>
            <div className="mt-4 rounded-[var(--radius-sm)] bg-paper-2 border border-line p-3">
              <div className="text-[10px] uppercase tracking-[0.1em] text-ink-4 font-semibold mb-1">
                Reasoning
              </div>
              <p className="text-[12px] text-ink-3 leading-relaxed font-mono">
                {insight.reasoning}
              </p>
            </div>

            {insight.recommendation && (
              <div className="mt-3 flex items-start gap-2 text-[13px]">
                <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <div>
                  <span className="font-medium text-ink">Recommend · </span>
                  <span className="text-ink-3">{insight.recommendation}</span>
                </div>
              </div>
            )}
            {insight.impact && (
              <div className="mt-1.5 flex items-start gap-2 text-[13px]">
                <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-amber shrink-0" />
                <div>
                  <span className="font-medium text-ink">Projected · </span>
                  <span className="text-ink-3">{insight.impact}</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px]">{insight.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-20 bg-paper-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand"
              style={{ width: `${insight.confidence * 100}%` }}
            />
          </div>
          <span className="numeric text-[11px] font-medium text-ink-3">
            {(insight.confidence * 100).toFixed(0)}% conf
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
