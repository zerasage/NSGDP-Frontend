"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, GraduationCap } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import { QA_DIMENSIONS } from "@/lib/constants/qa-checklist";
import { useLearningProgress } from "@/lib/learning/progress";
import { ProgressBar } from "./learning-primitives";

interface Step {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

/**
 * Onboarding checklist for dashboard home. Steps that reflect real activity
 * (first upload, team size) complete themselves; the rest track learning progress.
 */
export function GettingStartedCard({
  hasUploaded,
  teamSize,
  isAdmin,
}: {
  hasUploaded: boolean;
  teamSize: number;
  isAdmin: boolean;
}) {
  const { completed, checklist } = useLearningProgress();

  const totalChecks = QA_DIMENSIONS.reduce((n, d) => n + d.guidanceItems.length, 0);
  const tickedChecks = Object.values(checklist).filter(Boolean).length;

  const steps: Step[] = [
    {
      id: "read-upload",
      label: "Read how to upload a dataset",
      done: completed.includes("upload-your-first-dataset"),
      href: "/dashboard/learning/upload-your-first-dataset",
    },
    {
      id: "self-check",
      label: "Run the pre-submission self-check",
      done: tickedChecks >= totalChecks,
      href: "/dashboard/learning?tab=self-check",
    },
    {
      id: "upload",
      label: "Upload your first dataset",
      done: hasUploaded,
      href: "/upload",
    },
    {
      id: "review",
      label: "Learn what happens after you submit",
      done: completed.includes("after-you-submit"),
      href: "/dashboard/learning/after-you-submit",
    },
    ...(isAdmin
      ? [
          {
            id: "team",
            label: "Invite a teammate",
            done: teamSize > 1,
            href: "/dashboard/learning/invite-your-team",
          },
        ]
      : []),
  ];

  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <DashboardPanel
      title="Getting started"
      description={next ? "A few steps to get your first dataset live." : "You're all set. Nice work."}
      icon={GraduationCap}
      tone="primary"
      action={
        <Link
          href="/dashboard/learning"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          Learning hub
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} of {steps.length} done
            </span>
            <span className="tabular-nums">{percent}%</span>
          </div>
          <ProgressBar percent={percent} label="Getting started progress" />
        </div>

        <ul className="divide-y rounded-xl border">
          {steps.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex min-h-11 items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
              >
                {s.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Done" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/50" aria-label="To do" />
                )}
                <span className={s.done ? "text-muted-foreground line-through" : "font-medium"}>
                  {s.label}
                </span>
                {!s.done && s.id === next?.id ? (
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DashboardPanel>
  );
}
