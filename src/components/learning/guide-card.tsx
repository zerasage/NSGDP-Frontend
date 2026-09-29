"use client";

import { Bookmark, BookmarkCheck, Check } from "lucide-react";
import Link from "next/link";
import { METRIC_TONE } from "@/components/data/metric-card";
import { GUIDE_CATEGORIES } from "@/lib/learning/guides";
import { learningHref } from "@/lib/learning/helpers";
import type { Guide } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { CATEGORY_TONE, LEARNING_ICONS } from "./learning-icons";

/**
 * Thumbnail-style card — a big icon tile plus a title and one meta line,
 * so a grid of these reads at a glance instead of as a wall of text.
 */
export function GuideCard({
  guide,
  basePath,
  completed,
  bookmarked,
  onToggleBookmark,
}: {
  guide: Guide;
  basePath: string;
  completed: boolean;
  bookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
}) {
  const tone = METRIC_TONE[CATEGORY_TONE[guide.category]];
  const Icon = LEARNING_ICONS[guide.icon];
  const category = GUIDE_CATEGORIES.find((c) => c.id === guide.category);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/40",
        completed && "border-success/30",
      )}
    >
      <div className={cn("relative flex aspect-[4/3] items-center justify-center", tone.card)}>
        <Icon className={cn("size-11", tone.icon)} aria-hidden />

        <span className="absolute left-2.5 top-2.5 rounded-full border bg-background/90 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm">
          {category?.label}
        </span>

        <button
          type="button"
          onClick={() => onToggleBookmark(guide.slug)}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? `Remove ${guide.title} from saved` : `Save ${guide.title}`}
          className="absolute right-2.5 top-2.5 z-10 flex size-7 items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          {bookmarked ? (
            <BookmarkCheck className="size-3.5 text-primary" aria-hidden />
          ) : (
            <Bookmark className="size-3.5" aria-hidden />
          )}
        </button>

        {completed ? (
          <span className="absolute bottom-2.5 right-2.5 flex size-6 items-center justify-center rounded-full bg-success text-white shadow-sm">
            <Check className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <h3 className="text-sm font-semibold leading-5">
          <Link
            href={learningHref(basePath, guide.slug)}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">
          {guide.minutes} min · {guide.level}
        </p>
      </div>
    </article>
  );
}
