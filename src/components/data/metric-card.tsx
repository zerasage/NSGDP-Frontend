import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
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
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div className={cn("rounded-2xl border p-4", t.card)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border",
              t.well
            )}
          >
            <Icon className={cn("size-4", t.icon)} aria-hidden />
          </div>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          t.value
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
