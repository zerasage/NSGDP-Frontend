import { cn } from "@/lib/utils";
import type { DatasetStatus } from "@/types";

// Backend status values: draft, pending, under_review, validated, approved, rejected, archived
const CONFIG: Record<string, { label: string; className: string }> = {
  draft: { 
    label: "Draft", 
    className: "bg-muted text-muted-foreground" 
  },
  pending: { 
    label: "Pending Review", 
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
  },
  under_review: {
    label: "Under Review",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  validated: {
    label: "Validated",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  },
  // Approval and publishing are separate — an approved dataset isn't
  // necessarily visible to the public yet. See `publishedAt` below.
  approved: {
    label: "Approved",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  published: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground line-through",
  },
};
export function StatusBadge({
  status,
  publishedAt,
  className,
}: {
  status: DatasetStatus | string;
  publishedAt?: string | null;
  className?: string;
}) {
  const key = status === "approved" && publishedAt ? "published" : status;
  const config = CONFIG[key] || CONFIG.draft;
  const { label, className: tone } = config;
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
