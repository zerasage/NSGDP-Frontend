"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Lightbulb,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GUIDE_CATEGORIES, getGuide } from "@/lib/learning/guides";
import { AUDIENCE_LABEL, learningHref, resolveLearningHref } from "@/lib/learning/helpers";
import { LEARNING_PATHS } from "@/lib/learning/paths";
import { useLearningProgress } from "@/lib/learning/progress";
import type { Guide, GuideCallout } from "@/lib/learning/types";
import { GuideCard } from "./guide-card";
import { LEARNING_ICONS } from "./learning-icons";

const CALLOUT: Record<GuideCallout["tone"], { icon: typeof Info; box: string; icon_: string }> = {
  tip: { icon: Lightbulb, box: "border-success/25 bg-success/[0.06]", icon_: "text-success" },
  info: { icon: Info, box: "border-info/25 bg-info/[0.06]", icon_: "text-info" },
  warning: {
    icon: AlertTriangle,
    box: "border-warning/30 bg-warning/[0.08]",
    icon_: "text-amber-700 dark:text-warning",
  },
};

function formatUpdated(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function GuideArticle({ guide, basePath }: { guide: Guide; basePath: string }) {
  const progress = useLearningProgress();
  const done = progress.completed.includes(guide.slug);
  const saved = progress.bookmarks.includes(guide.slug);
  const vote = progress.feedback[guide.slug];

  const category = GUIDE_CATEGORIES.find((c) => c.id === guide.category);
  const Icon = LEARNING_ICONS[guide.icon];

  const path = LEARNING_PATHS.find((p) => p.guides.includes(guide.slug));
  const index = path ? path.guides.indexOf(guide.slug) : -1;
  const prev = path && index > 0 ? getGuide(path.guides[index - 1]) : undefined;
  const next = path && index >= 0 ? getGuide(path.guides[index + 1] ?? "") : undefined;

  const related = guide.related
    .map((slug) => getGuide(slug))
    .filter((g): g is Guide => Boolean(g))
    .slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <article className="min-w-0 space-y-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Link href={basePath} className="hover:text-foreground">
            Learning hub
          </Link>
          <span aria-hidden>/</span>
          <Link href={learningHref(basePath, undefined, "guides")} className="hover:text-foreground">
            {category?.label}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-foreground">{guide.title}</span>
        </nav>

        <header className="rounded-2xl border bg-card p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 sm:flex">
              <Icon className="size-6 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {category?.label}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{guide.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{guide.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden />
                  {guide.minutes} min read
                </span>
                <span>{guide.level}</span>
                <span>Updated {formatUpdated(guide.updated)}</span>
                {guide.audience.map((a) => (
                  <Badge key={a} variant="outline" className="h-5 text-[11px] font-normal">
                    {AUDIENCE_LABEL[a]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border bg-muted/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              What you&apos;ll be able to do
            </p>
            <ul className="mt-2 space-y-1.5">
              {guide.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[13px]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </header>

        {guide.callouts?.map((c) => {
          const style = CALLOUT[c.tone];
          const CIcon = style.icon;
          return (
            <div key={c.title} className={cn("flex gap-3 rounded-2xl border p-4", style.box)}>
              <CIcon className={cn("mt-0.5 size-5 shrink-0", style.icon_)} aria-hidden />
              <div className="text-[13px]">
                <p className="font-semibold">{c.title}</p>
                <p className="mt-0.5 text-muted-foreground">{c.body}</p>
              </div>
            </div>
          );
        })}

        <ol className="space-y-4">
          {guide.steps.map((step, i) => (
            <li key={step.title} id={`step-${i + 1}`} className="scroll-mt-24 rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-7">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>

                  {step.tip ? (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2 text-[13px]">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      <span>
                        <span className="font-medium">Tip: </span>
                        {step.tip}
                      </span>
                    </p>
                  ) : null}

                  {step.screenshot ? (
                    <figure className="mt-3">
                      <div className="flex aspect-[16/7] items-center justify-center rounded-xl border border-dashed bg-muted/30">
                        <ImageIcon className="size-8 text-muted-foreground/40" aria-hidden />
                      </div>
                      <figcaption className="mt-1.5 text-xs text-muted-foreground">
                        {step.screenshot}
                      </figcaption>
                    </figure>
                  ) : null}

                  {step.link ? (
                    <Link
                      href={resolveLearningHref(step.link.href, basePath)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3 h-9 gap-2")}
                    >
                      {step.link.label}
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {guide.cta ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-sm font-semibold">Ready to try it?</p>
              <p className="text-[13px] text-muted-foreground">
                Go straight to the page this guide is about.
              </p>
            </div>
            <Link
              href={resolveLearningHref(guide.cta.href, basePath)}
              className={cn(buttonVariants(), "h-10 shrink-0 gap-2")}
            >
              {guide.cta.label}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : null}

        <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label="Finish this guide">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {done ? "You've completed this guide" : "Finished reading?"}
              </p>
              <p className="text-[13px] text-muted-foreground">
                Marking it complete updates your learning path progress.
              </p>
            </div>
            <Button
              type="button"
              variant={done ? "secondary" : "default"}
              className="h-10 gap-2"
              onClick={() => progress.toggleCompleted(guide.slug)}
            >
              <CheckCircle2 className="size-4" aria-hidden />
              {done ? "Completed" : "Mark as complete"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="mr-1 text-[13px] text-muted-foreground">Was this helpful?</span>
            <Button
              type="button"
              size="sm"
              variant={vote === "up" ? "secondary" : "outline"}
              className="h-8 gap-1.5"
              aria-pressed={vote === "up"}
              onClick={() => progress.setFeedback(guide.slug, "up")}
            >
              <ThumbsUp className="size-3.5" aria-hidden />
              Yes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={vote === "down" ? "secondary" : "outline"}
              className="h-8 gap-1.5"
              aria-pressed={vote === "down"}
              onClick={() => progress.setFeedback(guide.slug, "down")}
            >
              <ThumbsDown className="size-3.5" aria-hidden />
              No
            </Button>
            {vote ? (
              <span className="text-[13px] text-muted-foreground">
                Thanks.{" "}
                {vote === "down" ? (
                  <Link href="/contact" className="text-primary underline-offset-2 hover:underline">
                    Tell us what was missing
                  </Link>
                ) : null}
              </span>
            ) : null}
          </div>
        </section>

        {prev || next ? (
          <nav aria-label="Guide navigation" className="grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                href={learningHref(basePath, prev.slug)}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <ArrowLeft className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Previous</span>
                  <span className="block truncate text-sm font-medium">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={learningHref(basePath, next.slug)}
                className="flex items-center justify-end gap-3 rounded-2xl border bg-card p-4 text-right transition-colors hover:border-primary/40"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Next</span>
                  <span className="block truncate text-sm font-medium">{next.title}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ) : null}
          </nav>
        ) : null}

        {related.length > 0 ? (
          <section className="space-y-3" aria-label="Related guides">
            <h2 className="text-[13px] font-medium">Related guides</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {related.map((g) => (
                <GuideCard
                  key={g.slug}
                  guide={g}
                  basePath={basePath}
                  completed={progress.completed.includes(g.slug)}
                  bookmarked={progress.bookmarks.includes(g.slug)}
                  onToggleBookmark={progress.toggleBookmark}
                />
              ))}
            </div>
          </section>
        ) : null}
      </article>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ol className="mt-3 space-y-1">
              {guide.steps.map((s, i) => (
                <li key={s.title}>
                  <a
                    href={`#step-${i + 1}`}
                    className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    <span className="w-4 shrink-0 tabular-nums">{i + 1}</span>
                    <span className="min-w-0">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-2"
            aria-pressed={saved}
            onClick={() => progress.toggleBookmark(guide.slug)}
          >
            {saved ? (
              <BookmarkCheck className="size-4 text-primary" aria-hidden />
            ) : (
              <Bookmark className="size-4" aria-hidden />
            )}
            {saved ? "Saved" : "Save for later"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
