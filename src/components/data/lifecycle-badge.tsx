import { cn } from "@/lib/utils";
import type { LifecycleStage } from "@/types";
import { LIFECYCLE_LABELS } from "@/types";
import { statusSurface } from "@/lib/constants/status-surfaces";

const STAGE_STYLES: Record<LifecycleStage, string> = {
  draft: statusSurface.gray,
  submitted: statusSurface.blue,
  under_review: statusSurface.violet,
  validated: statusSurface.purple,
  approved: statusSurface.amber,
  published: statusSurface.emerald,
  archived: statusSurface.grayMuted,
};

const STAGE_DOT: Record<LifecycleStage, string> = {
  draft: "bg-gray-400",
  submitted: "bg-blue-500",
  under_review: "bg-violet-500",
  validated: "bg-purple-500",
  approved: "bg-amber-500",
  published: "bg-emerald-500",
  archived: "bg-gray-400",
};

interface LifecycleBadgeProps {
  stage: LifecycleStage;
  className?: string;
  showDot?: boolean;
}

export function LifecycleBadge({ stage, className, showDot = true }: LifecycleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STAGE_STYLES[stage],
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", STAGE_DOT[stage])}
          aria-hidden
        />
      )}
      {LIFECYCLE_LABELS[stage]}
    </span>
  );
}
