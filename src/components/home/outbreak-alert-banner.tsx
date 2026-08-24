"use client";

import { useState } from "react";
import { AlertTriangle, Info, X, ChevronDown, ChevronUp } from "lucide-react";
import type { OutbreakAlert, AlertSeverity } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG: Record<AlertSeverity, {
  containerClass: string;
  iconClass: string;
  icon: typeof AlertTriangle;
  label: string;
}> = {
  critical: {
    containerClass: "bg-destructive/10 border-destructive/30 text-destructive",
    iconClass: "text-destructive",
    icon: AlertTriangle,
    label: "Critical Alert",
  },
  warning: {
    containerClass: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
    iconClass: "text-amber-600",
    icon: AlertTriangle,
    label: "Health Watch",
  },
  info: {
    containerClass: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    iconClass: "text-blue-600",
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
    <div className={cn("rounded-lg border px-4 py-3", config.containerClass)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("size-5 shrink-0 mt-0.5", config.iconClass)} aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70">{config.label}</span>
            <span className="text-xs opacity-60">·</span>
            <span className="text-xs opacity-60">
              {formatDistanceToNow(new Date(alert.publishedAt), { addSuffix: true })}
            </span>
            <span className="text-xs opacity-60">·</span>
            <span className="text-xs font-medium">{alert.affectedLGAs.join(", ")} LGA{alert.affectedLGAs.length > 1 ? "s" : ""}</span>
          </div>
          <p className="font-semibold text-sm mt-0.5">{alert.title}</p>
          {expanded && (
            <p className="text-sm mt-1.5 opacity-85">{alert.summary}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 opacity-60 hover:opacity-100"
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
      <div className="space-y-2 py-3">
        {active.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-0 text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Dismiss alerts"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
