import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { METRIC_TONE, type MetricTone } from "@/components/data/metric-card";

export function PageEyebrow({
  label,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  icon: LucideIcon;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div
      className={cn(
        "mb-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1",
        t.well
      )}
    >
      <Icon className={cn("size-3.5", t.icon)} aria-hidden />
      <span className={cn("text-[11px] font-semibold uppercase tracking-wide", t.icon)}>
        {label}
      </span>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold leading-6">{title}</h2>
          {description ? (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[13px] font-medium text-foreground">{children}</p>;
}
