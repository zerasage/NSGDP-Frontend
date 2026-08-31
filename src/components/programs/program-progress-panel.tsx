"use client";

import { useState } from "react";
import { Loader2, Save, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProgramProgress } from "@/lib/hooks/usePrograms";
import type { Program } from "@/types";
import { LgaCoverageChecklist } from "@/components/programs/lga-coverage-checklist";
import {
  lgaCoverageCounts,
  lgaCoveragePercent,
  outcomeMetricPercent,
  tracksLgaCoverage,
  tracksOutcomeMetric,
} from "@/lib/constants/program-progress";
import { toast } from "sonner";

function parseOptionalInt(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : undefined;
}

function ProgressBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface ProgramProgressPanelProps {
  programme: Program;
  onClose?: () => void;
  onSuccess?: () => void;
  variant?: "inline" | "dialog";
}

export function ProgramProgressPanel({
  programme,
  onClose,
  onSuccess,
  variant = "inline",
}: ProgramProgressPanelProps) {
  const updateMutation = useUpdateProgramProgress();
  const mode = programme.progressMode ?? "lga_coverage";
  const showLga = tracksLgaCoverage(mode);
  const showOutcome = tracksOutcomeMetric(mode);

  const [reachCount, setReachCount] = useState(
    programme.reachCount?.toString() ?? "",
  );
  const [coveredLgas, setCoveredLgas] = useState<string[]>(
    programme.coveredLgas ?? [],
  );
  const [status, setStatus] = useState<"active" | "completed" | "suspended">(
    programme.rawStatus === "completed" || programme.rawStatus === "suspended"
      ? programme.rawStatus
      : "active",
  );

  const targetLgas = programme.targetLgas ?? [];
  const lgaCounts = lgaCoverageCounts({ ...programme, coveredLgas });
  const lgaPct = lgaCoveragePercent({ ...programme, coveredLgas });
  const outcomePct = outcomeMetricPercent({
    targetCount: programme.targetCount,
    reachCount: parseOptionalInt(reachCount) ?? programme.reachCount,
  });

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: programme.slug,
        data: {
          coveredLgas: showLga ? coveredLgas : undefined,
          reachCount: showOutcome ? parseOptionalInt(reachCount) : undefined,
          status: programme.rawStatus === "archived" ? undefined : status,
        },
      });
      toast.success("Programme progress updated");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update progress",
      );
    }
  };

  const content = (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <TrendingUp className="size-4" />
          Update progress
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "combined"
            ? "Track LGA coverage and your outcome metric separately."
            : mode === "lga_coverage"
              ? "Mark which target LGAs are covered."
              : "Update how much of your outcome target has been reached."}
        </p>
      </div>

      {showLga && (
        <div>
          <label className="text-sm font-medium">Covered LGAs</label>
          <p className="mt-0.5 mb-1.5 text-xs text-muted-foreground">
            {lgaCounts.reach} of {lgaCounts.target} target LGAs covered
          </p>
          <LgaCoverageChecklist
            targetLgas={targetLgas}
            coveredLgas={coveredLgas}
            onChange={setCoveredLgas}
            disabled={updateMutation.isPending}
          />
        </div>
      )}

      {showOutcome && (
        <div>
          <label className="text-sm font-medium" htmlFor="progress-reach">
            {programme.primaryMetric || "Outcome"} reached
          </label>
          <Input
            id="progress-reach"
            type="number"
            min={0}
            className="mt-1.5"
            value={reachCount}
            onChange={(e) => setReachCount(e.target.value)}
          />
          {programme.targetCount != null && programme.targetCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Target: {programme.targetCount.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {programme.rawStatus !== "archived" && (
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "active" | "completed" | "suspended")}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showLga && lgaPct != null && (
        <ProgressBar
          label="LGA coverage"
          pct={lgaPct}
          detail={`${lgaCounts.reach} / ${lgaCounts.target} LGAs`}
        />
      )}

      {showOutcome && outcomePct != null && (
        <ProgressBar
          label={programme.primaryMetric || "Outcome"}
          pct={outcomePct}
          detail={`${(parseOptionalInt(reachCount) ?? programme.reachCount ?? 0).toLocaleString()} / ${programme.targetCount?.toLocaleString()} reached`}
        />
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
            <X className="size-4 mr-1.5" />
            Cancel
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4 mr-1.5" />
          )}
          Save progress
        </Button>
      </div>
    </div>
  );

  if (variant === "dialog") {
    return content;
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      {content}
    </div>
  );
}
