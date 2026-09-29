"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  PlayCircle,
  Search,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GUIDE_CATEGORIES, GUIDES } from "@/lib/learning/guides";
import {
  guideMatchesAudience,
  learningHref,
  nextGuideInPath,
  pathForAudience,
  pathProgress,
  searchLearning,
} from "@/lib/learning/helpers";
import { useLearningProgress } from "@/lib/learning/progress";
import type { AudienceFilter } from "@/lib/learning/types";
import type { CategoryFilter } from "./learning-hub-types";
import { GuideCard } from "./guide-card";
import { GuidesTab } from "./guides-tab";
import { HelpTab } from "./help-tab";
import { EmptyNote, SegmentedTabs } from "./learning-primitives";
import { LearningSidebar } from "./learning-sidebar";
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
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
  const [category, setCategory] = useState<CategoryFilter>("all");

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

  const path = pathForAudience(audience);
  const pathStats = pathProgress(path, progress.completed);
  const nextGuide = nextGuideInPath(path, progress.completed);

  const searching = query.trim().length > 0;

  const tabs = TABS.map((t) =>
    t.id === "guides" ? { ...t, count: audienceGuides.length } : t,
  );

  const savedCount = audienceGuides.filter((g) => progress.bookmarks.includes(g.slug)).length;
  const sidebarCategories =
    tab === "guides"
      ? [
          { id: "all", label: "All guides", count: audienceGuides.length },
          ...GUIDE_CATEGORIES.map((c) => ({
            id: c.id,
            label: c.label,
            count: audienceGuides.filter((g) => g.category === c.id).length,
          })),
          { id: "saved", label: "Saved", count: savedCount },
        ]
      : undefined;

  return (
    <LearningShell
      variant={variant}
      eyebrow="Learning hub"
      eyebrowIcon={GraduationCap}
      title="Learn to use the portal"
      description="Step-by-step guides for sharing data, managing your team, and exploring Niger State health data."
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <LearningSidebar
          audiences={AUDIENCES}
          audience={audience}
          onAudienceChange={setAudienceOverride}
          sections={tabs}
          activeSection={tab}
          onSectionChange={(id) => setTab(id as TabId)}
          categories={sidebarCategories}
          activeCategory={category}
          onCategoryChange={(id) => setCategory(id as CategoryFilter)}
        />

        <div className="min-w-0 flex-1 space-y-6">
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
            {/* lg+ uses the side panel's "Viewing as" list instead. */}
            <div className="max-w-full lg:hidden">
              <SegmentedTabs
                tabs={AUDIENCES}
                value={audience}
                onChange={setAudienceOverride}
                label="Show content for"
              />
            </div>
          </div>

          {!searching && nextGuide ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 px-4 py-2.5">
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {pathStats.percent}%
              </span>
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="text-muted-foreground">
                  {pathStats.done === 0 ? "Start with" : "Continue with"}
                </span>{" "}
                <span className="font-medium">{nextGuide.title}</span>
              </p>
              <Link
                href={learningHref(basePath, nextGuide.slug)}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 shrink-0 gap-1.5")}
              >
                {pathStats.done === 0 ? "Start" : "Continue"}
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
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
              {/* lg+ uses the side panel's "Browse" nav instead. */}
              <div className="lg:hidden">
                <SegmentedTabs tabs={tabs} value={tab} onChange={setTab} label="Learning hub sections" />
              </div>

              <div role="tabpanel" className="space-y-6">
                {tab === "guides" ? (
                  <GuidesTab
                    audience={audience}
                    basePath={basePath}
                    completed={progress.completed}
                    bookmarks={progress.bookmarks}
                    onToggleBookmark={progress.toggleBookmark}
                    category={category}
                    onCategoryChange={setCategory}
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
        </div>
      </div>
    </LearningShell>
  );
}

function HubSkeleton() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
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
