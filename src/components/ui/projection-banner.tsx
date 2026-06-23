import type { ReactNode } from "react";

// A slim, honest banner for the Vision/pitch pages so projected/illustrative
// figures are never mistaken for live pilot data.
export function ProjectionBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="border-b border-line bg-paper-2">
      <div className="mx-auto max-w-7xl px-6 py-2.5 flex items-center gap-2.5 text-[12.5px] text-ink-3">
        <span className="inline-flex items-center rounded-full bg-paper-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-2">
          Projection
        </span>
        <span>
          {children ?? "Illustrative model at full-campus scale, not live pilot data. The live product is the Challenge."}
        </span>
      </div>
    </div>
  );
}
