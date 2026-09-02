import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

export type MetricTone =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "muted";

export const METRIC_TONE: Record<
  MetricTone,
  { card: string; well: string; icon: string; value: string }
> = {
  primary: {
    card: "border-primary/20 bg-primary/[0.04]",
    well: "border-primary/20 bg-primary/10",
    icon: "text-primary",
    value: "text-foreground",
  },
  success: {
    card: "border-success/25 bg-success/[0.06]",
    well: "border-success/25 bg-success/15",
    icon: "text-success",
    value: "text-foreground",
  },
  info: {
    card: "border-info/25 bg-info/[0.06]",
    well: "border-info/25 bg-info/15",
    icon: "text-info",
    value: "text-foreground",
  },
  warning: {
    card: "border-warning/30 bg-warning/[0.08]",
    well: "border-warning/30 bg-warning/20",
    icon: "text-amber-700 dark:text-warning",
    value: "text-foreground",
  },
  destructive: {
    card: "border-destructive/20 bg-destructive/[0.05]",
    well: "border-destructive/20 bg-destructive/10",
    icon: "text-destructive",
    value: "text-foreground",
  },
  muted: {
    card: "border-dashed bg-muted/20",
    well: "border-border bg-muted/50",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
  onClick,
  tip,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  className?: string;
  onClick?: () => void;
  tip?: string;
}) {
  const t = METRIC_TONE[tone];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        t.card,
        onClick && "hover:bg-muted/30 active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {tip ? <HelpTip content={tip} label={`Help: ${label}`} iconClassName="size-3.5" /> : null}
        </p>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border",
              t.well,
            )}
          >
            <Icon className={cn("size-4", t.icon)} aria-hidden />
          </div>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl",
          t.value,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            onClick && "underline decoration-dotted underline-offset-2",
          )}
        >
          {hint}
        </p>
      ) : null}
    </Wrapper>
  );
}

export function HeroMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "primary",
  className,
  footer,
  tip,
}: {
  label: string;
  value: ReactNode;
  description: string;
  icon: LucideIcon;
  tone?: MetricTone;
  className?: string;
  footer?: ReactNode;
  tip?: string;
}) {
  const t = METRIC_TONE[tone];

  return (
    <div
      className={cn(
        "flex min-h-[168px] flex-col justify-between rounded-2xl border p-4 sm:p-5",
        t.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
            {tip ? <HelpTip content={tip} label={`Help: ${label}`} iconClassName="size-3.5" /> : null}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl border sm:size-14",
            t.well,
          )}
        >
          <Icon className={cn("size-6 sm:size-7", t.icon)} aria-hidden />
        </div>
      </div>
      <div className="mt-4">
        <p
          className={cn(
            "text-4xl font-bold tabular-nums tracking-tight sm:text-5xl",
            t.value,
          )}
        >
          {value}
        </p>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function DashboardPanel({
  title,
  titleTip,
  description,
  action,
  children,
  className,
  tone = "primary",
  icon: Icon,
}: {
  title: ReactNode;
  titleTip?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: MetricTone;
  icon?: LucideIcon;
}) {
  const t = METRIC_TONE[tone];

  return (
    <section className={cn("overflow-hidden rounded-2xl border bg-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="flex items-center gap-2 text-base font-semibold leading-6">
            {Icon ? (
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                  t.well,
                )}
              >
                <Icon className={cn("size-4", t.icon)} aria-hidden />
              </span>
            ) : null}
            {title}
            {titleTip ? (
              <HelpTip
                content={titleTip}
                label={typeof title === "string" ? `Help: ${title}` : "Section help"}
              />
            ) : null}
          </h2>
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

export function FilterChip({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && count > 0 ? (
        <span className={cn("tabular-nums", active ? "opacity-90" : "opacity-70")}>
          ({count})
        </span>
      ) : null}
    </button>
  );
}

export function QuickActionChip({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
        primary
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-background hover:bg-muted/70",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function EmptyPanelState({
  icon: Icon,
  message,
  action,
}: {
  icon: LucideIcon;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
        <Icon className="size-6 text-muted-foreground opacity-70" aria-hidden />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
