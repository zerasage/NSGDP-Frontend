"use client";

import Link from "next/link";
import { BookmarkCheck, Bookmark, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { METRIC_TONE } from "@/components/data/metric-card";
import { cn } from "@/lib/utils";
import { AUDIENCE_LABEL, learningHref } from "@/lib/learning/helpers";
import { GUIDE_CATEGORIES } from "@/lib/learning/guides";
import type { Guide } from "@/lib/learning/types";
import { CATEGORY_TONE, LEARNING_ICONS } from "./learning-icons";

export function GuideCard({
  guide,
  basePath,
  completed,
  bookmarked,
  onToggleBookmark,
  featured = false,
}: {
  guide: Guide;
  basePath: string;
  completed: boolean;
  bookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  featured?: boolean;
}) {
  const tone = METRIC_TONE[CATEGORY_TONE[guide.category]];
  const Icon = LEARNING_ICONS[guide.icon];
  const category = GUIDE_CATEGORIES.find((c) => c.id === guide.category);

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5",
        featured && "lg:flex-row lg:items-start lg:gap-5",
        completed && "border-success/30",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border",
          featured ? "size-12" : "size-9",
          tone.well,
        )}
      >
        <Icon className={cn(featured ? "size-5" : "size-4", tone.icon)} aria-hidden />
      </div>

      <div className={cn("min-w-0 flex-1", featured ? "mt-3 lg:mt-0" : "mt-3")}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {category?.label}
          </p>
          <button
            type="button"
            onClick={() => onToggleBookmark(guide.slug)}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? `Remove ${guide.title} from saved` : `Save ${guide.title}`}
            className="relative z-10 -mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {bookmarked ? (
              <BookmarkCheck className="size-4 text-primary" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
          </button>
        </div>

        <h3 className="mt-1 text-base font-semibold leading-6">
          <Link
            href={learningHref(basePath, guide.slug)}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{guide.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {guide.minutes} min
          </span>
          <span>{guide.level}</span>
          {completed ? (
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <CheckCircle2 className="size-3.5" aria-hidden />
              Completed
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {guide.audience.map((a) => (
            <Badge key={a} variant="outline" className="h-5 text-[11px] font-normal">
              {AUDIENCE_LABEL[a]}
            </Badge>
          ))}
        </div>
      </div>
    </article>
  );
}
