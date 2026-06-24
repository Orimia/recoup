import { cn } from "@/lib/utils";

type Tone = "brand" | "amber" | "rose" | "slate" | "ink" | "neutral";

const toneStyles: Record<Tone, string> = {
  brand: "bg-brand-wash text-brand border-brand-soft",
  amber: "bg-amber-wash text-amber border-amber-soft",
  rose: "bg-rose-wash text-rose border-rose-soft",
  slate: "bg-[var(--slate-soft)] text-[var(--slate)] border-[var(--slate-soft)]",
  ink: "bg-ink text-paper border-ink",
  neutral: "bg-paper-2 text-ink-3 border-line",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full border whitespace-nowrap shrink-0",
        toneStyles[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "brand" }: { tone?: Tone }) {
  const colorMap: Record<Tone, string> = {
    brand: "bg-brand",
    amber: "bg-amber",
    rose: "bg-rose",
    slate: "bg-[var(--slate)]",
    ink: "bg-ink",
    neutral: "bg-ink-4",
  };
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", colorMap[tone])} />;
}
