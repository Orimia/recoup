import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export function Stat({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sublabel,
  size = "md",
  className,
  tooltip,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  tooltip?: string;
}) {
  const valueText = typeof value === "number" ? value.toLocaleString() : value;
  const sizes = {
    sm: "text-[22px]",
    md: "text-[28px]",
    lg: "text-[40px]",
  };

  return (
    <div className={cn("", className)} title={tooltip}>
      <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-ink-4">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className={cn("font-display font-semibold tracking-tight numeric", sizes[size])}>
          {valueText}
        </span>
        {unit && <span className="text-xs text-ink-4 font-medium">{unit}</span>}
      </div>
      {(delta !== undefined || sublabel) && (
        <div className="mt-1.5 flex items-center gap-2 text-[12px]">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                delta > 0 && "text-brand",
                delta < 0 && "text-rose",
                delta === 0 && "text-ink-4"
              )}
            >
              {delta > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : delta < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {(deltaLabel || sublabel) && (
            <span className="text-ink-4">{deltaLabel || sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
