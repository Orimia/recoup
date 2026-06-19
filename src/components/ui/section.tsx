import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl px-6", className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 mb-6", className)}>
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.12em] text-brand font-semibold mb-2">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-2xl md:text-[28px] font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm text-ink-3 max-w-xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.14em] text-brand font-semibold mb-2">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-[32px] md:text-[38px] font-semibold tracking-tight leading-[1.05] text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-[15px] text-ink-3 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
