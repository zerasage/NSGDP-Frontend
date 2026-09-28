"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { METRIC_TONE } from "@/components/data/metric-card";
import { cn } from "@/lib/utils";
import { getGuide } from "@/lib/learning/guides";
import {
  AUDIENCE_LABEL,
  formatMinutes,
  learningHref,
  nextGuideInPath,
  pathProgress,
  remainingMinutes,
} from "@/lib/learning/helpers";
import { LEARNING_PATHS } from "@/lib/learning/paths";
import type { AudienceFilter } from "@/lib/learning/types";
import { LEARNING_ICONS } from "./learning-icons";
import { ProgressBar } from "./learning-primitives";

export function PathsTab({
  audience,
  basePath,
  completed,
}: {
  audience: AudienceFilter;
  basePath: string;
  completed: string[];
}) {
  const paths = LEARNING_PATHS.filter((p) => audience === "all" || p.audience === audience);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">
        Paths put guides in the order you&apos;ll need them. Progress is saved in this browser as you
        mark guides complete.
      </p>

      {paths.map((path) => {
        const Icon = LEARNING_ICONS[path.icon];
        const tone = METRIC_TONE.primary;
        const progress = pathProgress(path, completed);
        const next = nextGuideInPath(path, completed);
        const left = remainingMinutes(path, completed);

        return (
          <section key={path.id} className="rounded-2xl border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                    tone.well,
                  )}
                >
                  <Icon className={cn("size-5", tone.icon)} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {AUDIENCE_LABEL[path.audience]}
                  </p>
                  <h2 className="text-base font-semibold leading-6">{path.title}</h2>
                  <p className="mt-0.5 max-w-2xl text-[13px] text-muted-foreground">
                    {path.description}
                  </p>
                </div>
              </div>

              <div className="w-full shrink-0 space-y-2 sm:w-56">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progress.done} of {progress.total} complete
                  </span>
                  <span className="font-medium tabular-nums text-foreground">{progress.percent}%</span>
                </div>
                <ProgressBar percent={progress.percent} label={`${path.title} progress`} />
                {next ? (
                  <Link
                    href={learningHref(basePath, next.slug)}
                    className={cn(buttonVariants({ size: "sm" }), "h-9 w-full")}
                  >
                    {progress.done === 0 ? "Start path" : "Continue"}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ) : (
                  <p className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/[0.06] text-sm font-medium text-success">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Path complete
                  </p>
                )}
                {left > 0 ? (
                  <p className="text-center text-[11px] text-muted-foreground">
                    About {formatMinutes(left)} left
                  </p>
                ) : null}
              </div>
            </div>

            <ol className="divide-y">
              {path.guides.map((slug, i) => {
                const guide = getGuide(slug);
                if (!guide) return null;
                const done = completed.includes(slug);
                return (
                  <li key={slug}>
                    <Link
                      href={learningHref(basePath, slug)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:px-5"
                    >
                      {done ? (
                        <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Completed" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground/50" aria-label="Not started" />
                      )}
                      <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium",
                            done && "text-muted-foreground",
                          )}
                        >
                          {guide.title}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {guide.minutes} min
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
