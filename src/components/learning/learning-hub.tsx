"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  GraduationCap,
  PlayCircle,
  Route,
  Search,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dashboard/portal-dashboard-ui";
import { cn } from "@/lib/utils";
import { GUIDES } from "@/lib/learning/guides";
import {
  formatMinutes,
  guideMatchesAudience,
  learningHref,
  nextGuideInPath,
  pathForAudience,
  pathProgress,
  remainingMinutes,
  searchLearning,
} from "@/lib/learning/helpers";
import { useLearningProgress } from "@/lib/learning/progress";
import type { AudienceFilter } from "@/lib/learning/types";
import { GuideCard } from "./guide-card";
import { GuidesTab } from "./guides-tab";
import { HelpTab } from "./help-tab";
import { EmptyNote, ProgressBar, SegmentedTabs } from "./learning-primitives";
import { LEARNING_BASE_PATH, LearningShell, type LearningVariant } from "./learning-shell";
import { PathsTab } from "./paths-tab";
import { ReferenceTab } from "./reference-tab";
import { SelfCheckTab } from "./self-check-tab";
import { TemplatesTab } from "./templates-tab";
import { VideosTab } from "./videos-tab";

type TabId = "guides" | "paths" | "videos" | "templates" | "self-check" | "reference" | "help";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "guides", label: "Guides" },
  { id: "paths", label: "Learning paths" },
  { id: "videos", label: "Videos" },
  { id: "templates", label: "Templates" },
  { id: "self-check", label: "Self-check" },
  { id: "reference", label: "Reference" },
  { id: "help", label: "Help & training" },
];

const AUDIENCES: Array<{ id: AudienceFilter; label: string }> = [
  { id: "viewer", label: "Public" },
  { id: "contributor", label: "Contributor" },
  { id: "partner_admin", label: "Partner admin" },
  { id: "all", label: "Everyone" },
];

function isTabId(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function SearchResults({
  query,
  audience,
  basePath,
  progress,
  onClear,
}: {
  query: string;
  audience: AudienceFilter;
  basePath: string;
  progress: ReturnType<typeof useLearningProgress>;
  onClear: () => void;
}) {
  const results = useMemo(() => searchLearning(query, audience), [query, audience]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          {results.total} result{results.total === 1 ? "" : "s"} for{" "}
          <span className="font-medium text-foreground">&ldquo;{query.trim()}&rdquo;</span>
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onClear}>
          <X className="size-3.5" aria-hidden />
          Clear search
        </Button>
      </div>

      {results.total === 0 ? (
        <EmptyNote>
          Nothing matched. Try fewer words, or ask the data team from the Help tab.
        </EmptyNote>
      ) : null}

      {results.guides.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[13px] font-medium">Guides ({results.guides.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {results.guides.map((g) => (
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

      {results.videos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[13px] font-medium">Videos ({results.videos.length})</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {results.videos.map((v) => (
              <li key={v.id}>
                <Link
                  href={learningHref(basePath, undefined, "videos")}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <PlayCircle className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{v.duration}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.faqs.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[13px] font-medium">FAQ ({results.faqs.length})</h2>
          <ul className="divide-y rounded-2xl border bg-card">
            {results.faqs.map((f) => (
              <li key={f.id} className="px-4 py-3">
                <p className="text-sm font-medium">{f.question}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{f.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results.glossary.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-[13px] font-medium">Glossary ({results.glossary.length})</h2>
          <dl className="divide-y rounded-2xl border bg-card">
            {results.glossary.map((t) => (
              <div key={t.term} className="px-4 py-3">
                <dt className="text-sm font-medium">{t.term}</dt>
                <dd className="mt-1 text-[13px] text-muted-foreground">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function LearningHubInner({ variant }: { variant: LearningVariant }) {
  const basePath = LEARNING_BASE_PATH[variant];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progress = useLearningProgress();

  const [audienceOverride, setAudienceOverride] = useState<AudienceFilter | null>(null);
  const [query, setQuery] = useState("");

  const audience = audienceOverride ?? "viewer";
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "guides";

  const setTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "guides") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const audienceGuides = useMemo(
    () => GUIDES.filter((g) => guideMatchesAudience(g, audience)),
    [audience],
  );
  const completedInView = audienceGuides.filter((g) => progress.completed.includes(g.slug)).length;
  const savedInView = audienceGuides.filter((g) => progress.bookmarks.includes(g.slug)).length;

  const path = pathForAudience(audience);
  const pathStats = pathProgress(path, progress.completed);
  const nextGuide = nextGuideInPath(path, progress.completed);
  const minutesLeft = remainingMinutes(path, progress.completed);

  const searching = query.trim().length > 0;

  const tabs = TABS.map((t) =>
    t.id === "guides" ? { ...t, count: audienceGuides.length } : t,
  );

  return (
    <LearningShell
      variant={variant}
      eyebrow="Learning hub"
      eyebrowIcon={GraduationCap}
      title="Learn to use the portal"
      description="Step-by-step guides for sharing data, managing your team, and exploring Niger State health data."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides, videos, FAQs and terms"
            aria-label="Search the learning hub"
            className="h-11 pl-10"
          />
        </div>
        <div className="max-w-full lg:shrink-0">
          <SegmentedTabs
            tabs={AUDIENCES}
            value={audience}
            onChange={setAudienceOverride}
            label="Show content for"
          />
        </div>
      </div>

      {!searching ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Guides completed"
              value={`${completedInView}/${audienceGuides.length}`}
              hint="For this audience"
              icon={CheckCircle2}
              tone="success"
            />
            <MetricCard
              label="Path progress"
              value={`${pathStats.percent}%`}
              hint={path.title}
              icon={Route}
              tone="primary"
              onClick={() => setTab("paths")}
            />
            <MetricCard
              label="Time to finish"
              value={minutesLeft === 0 ? "Done" : formatMinutes(minutesLeft)}
              hint="Left in your path"
              icon={Clock}
              tone="info"
            />
            <MetricCard
              label="Saved"
              value={savedInView}
              hint="Guides to revisit"
              icon={Bookmark}
              tone="warning"
              onClick={() => setTab("guides")}
            />
          </div>

          <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-label="Continue learning">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {pathStats.done === 0 ? "Start here" : nextGuide ? "Continue where you left off" : "Path complete"}
                </p>
                {nextGuide ? (
                  <>
                    <h2 className="mt-1 text-base font-semibold">{nextGuide.title}</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{nextGuide.summary}</p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-1 text-base font-semibold">You&apos;ve finished the {path.title}</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      Revisit any guide, or try the pre-submission self-check before your next upload.
                    </p>
                  </>
                )}
                <div className="mt-3 max-w-md space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {pathStats.done} of {pathStats.total} in {path.title}
                    </span>
                    <span className="tabular-nums">{pathStats.percent}%</span>
                  </div>
                  <ProgressBar percent={pathStats.percent} label={`${path.title} progress`} />
                </div>
              </div>
              {nextGuide ? (
                <Link
                  href={learningHref(basePath, nextGuide.slug)}
                  className={cn(buttonVariants(), "h-10 shrink-0 gap-2")}
                >
                  {pathStats.done === 0 ? "Start learning" : "Continue"}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => setTab("self-check")}>
                  Open self-check
                </Button>
              )}
            </div>
          </section>
        </>
      ) : null}

      {searching ? (
        <SearchResults
          query={query}
          audience={audience}
          basePath={basePath}
          progress={progress}
          onClear={() => setQuery("")}
        />
      ) : (
        <>
          <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} label="Learning hub sections" />

          <div role="tabpanel" className="space-y-6">
            {tab === "guides" ? (
              <GuidesTab
                audience={audience}
                basePath={basePath}
                completed={progress.completed}
                bookmarks={progress.bookmarks}
                onToggleBookmark={progress.toggleBookmark}
              />
            ) : null}
            {tab === "paths" ? (
              <PathsTab audience={audience} basePath={basePath} completed={progress.completed} />
            ) : null}
            {tab === "videos" ? <VideosTab basePath={basePath} /> : null}
            {tab === "templates" ? <TemplatesTab audience={audience} /> : null}
            {tab === "self-check" ? (
              <SelfCheckTab
                checklist={progress.checklist}
                onToggle={progress.setChecked}
                onReset={progress.resetChecklist}
              />
            ) : null}
            {tab === "reference" ? <ReferenceTab /> : null}
            {tab === "help" ? <HelpTab audience={audience} basePath={basePath} /> : null}
          </div>
        </>
      )}
    </LearningShell>
  );
}

function HubSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-11 w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function LearningHub({ variant }: { variant: LearningVariant }) {
  return (
    <Suspense fallback={<HubSkeleton />}>
      <LearningHubInner variant={variant} />
    </Suspense>
  );
}
