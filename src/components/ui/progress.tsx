import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "amber" | "rose" | "ink";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const toneClass = {
    brand: "bg-brand",
    amber: "bg-amber",
    rose: "bg-rose",
    ink: "bg-ink",
  }[tone];

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex items-center justify-between text-[11px] text-ink-4 mb-1">
          <span>{label}</span>
          <span className="numeric font-medium text-ink-3">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-paper-3 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-500", toneClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
