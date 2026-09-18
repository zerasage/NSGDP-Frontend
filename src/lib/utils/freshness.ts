import type { FreshnessStatus } from "@/types";

function getNextDueDate(updatedAt: string, frequency?: string): Date | null {
  const base = new Date(updatedAt);
  const freq = frequency?.toLowerCase();
  if (!freq) return null;
  if (freq.includes("daily"))     { base.setDate(base.getDate() + 1);    return base; }
  if (freq.includes("weekly"))    { base.setDate(base.getDate() + 7);    return base; }
  if (freq.includes("monthly"))   { base.setMonth(base.getMonth() + 1);  return base; }
  if (freq.includes("quarterly")) { base.setMonth(base.getMonth() + 3);  return base; }
  if (freq.includes("bi-annual") || freq.includes("biannual")) {
    base.setMonth(base.getMonth() + 6);
    return base;
  }
  if (freq.includes("annually") || freq.includes("annual")) {
    base.setFullYear(base.getFullYear() + 1);
    return base;
  }
  return null;
}

export function getFreshnessStatus(updatedAt: string, frequency?: string): FreshnessStatus {
  const dueDate = getNextDueDate(updatedAt, frequency);
  if (!dueDate) return "unknown";
  const now = new Date();
  const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays < 14) return "due_soon";
  return "fresh";
}

export function getFreshnessLabel(status: FreshnessStatus): string {
  const labels: Record<FreshnessStatus, string> = {
    fresh: "Up to date",
    due_soon: "Update due soon",
    overdue: "Update overdue",
    unknown: "Unknown",
  };
  return labels[status];
}

export function getFreshnessColor(status: FreshnessStatus): string {
  const colors: Record<FreshnessStatus, string> = {
    fresh: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
    due_soon: "text-amber-600 bg-amber-50 dark:bg-amber-950",
    overdue: "text-red-600 bg-red-50 dark:bg-red-950",
    unknown: "text-gray-600 bg-gray-50 dark:bg-gray-950",
  };
  return colors[status];
}
