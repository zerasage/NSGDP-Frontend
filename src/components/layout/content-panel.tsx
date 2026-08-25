import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { METRIC_TONE, type MetricTone } from "@/components/data/metric-card";

export function PageEyebrow({
  label,
  icon: Icon,
}: {
  label: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
      {Icon ? <Icon className="size-3" aria-hidden /> : null}
      {label}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[13px] font-medium text-foreground">{children}</p>
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
        {action ? (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        ) : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EntityCard({
  icon: Icon,
  title,
  description,
  href,
  tone = "primary",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  const body = (
    <>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg border",
          t.well
        )}
      >
        <Icon className={cn("size-4", t.icon)} aria-hidden />
      </div>
      <h3 className="mt-3 text-base font-semibold leading-6">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </>
  );

  const className = cn(
    "rounded-2xl border bg-card p-4 sm:p-5",
    href && "transition-colors hover:border-primary/40"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
