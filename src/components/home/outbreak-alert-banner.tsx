"use client";

import { useState } from "react";
import { AlertTriangle, Info, X, ChevronDown, ChevronUp } from "lucide-react";
import type { OutbreakAlert, AlertSeverity } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  {
    containerClass: string;
    iconClass: string;
    wellClass: string;
    icon: typeof AlertTriangle;
    label: string;
  }
> = {
  critical: {
    containerClass: "border-destructive/20 bg-destructive/[0.05] text-foreground",
    iconClass: "text-destructive",
    wellClass: "border-destructive/20 bg-destructive/10",
    icon: AlertTriangle,
    label: "Critical alert",
  },
  warning: {
    containerClass: "border-warning/30 bg-warning/[0.08] text-foreground",
    iconClass: "text-amber-700 dark:text-warning",
    wellClass: "border-warning/30 bg-warning/20",
    icon: AlertTriangle,
    label: "Health watch",
  },
  info: {
    containerClass: "border-info/25 bg-info/[0.06] text-foreground",
    iconClass: "text-info",
    wellClass: "border-info/25 bg-info/15",
    icon: Info,
    label: "Information",
  },
};

interface OutbreakAlertBannerProps {
  alerts: OutbreakAlert[];
}

function AlertItem({ alert }: { alert: OutbreakAlert }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-2xl border px-4 py-3", config.containerClass)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border",
            config.wellClass
          )}
        >
          <Icon className={cn("size-4", config.iconClass)} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.publishedAt), { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-[13px] font-medium">
              {alert.affectedLGAs.join(", ")} LGA
              {alert.affectedLGAs.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-semibold">{alert.title}</p>
          {expanded && (
            <p className="mt-1.5 text-sm text-muted-foreground">{alert.summary}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Collapse alert" : "Expand alert"}
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>
    </div>
  );
}

export function OutbreakAlertBanner({ alerts }: OutbreakAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const active = alerts.filter((a) => a.active);
  if (!active.length || dismissed) return null;

  return (
    <div className="relative">
      <div className="space-y-2">
        {active.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute -right-1 -top-1 text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Dismiss alerts"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
