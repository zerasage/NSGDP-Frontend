"use client";

import { useMemo, useState } from "react";
import { FilterChip } from "@/components/dashboard/portal-dashboard-ui";
import { GUIDE_CATEGORIES, GUIDES } from "@/lib/learning/guides";
import { guideMatchesAudience } from "@/lib/learning/helpers";
import type { AudienceFilter, GuideCategory } from "@/lib/learning/types";
import { GuideCard } from "./guide-card";
import { EmptyNote } from "./learning-primitives";

type CategoryFilter = GuideCategory | "all" | "saved";

export function GuidesTab({
  audience,
  basePath,
  completed,
  bookmarks,
  onToggleBookmark,
}: {
  audience: AudienceFilter;
  basePath: string;
  completed: string[];
  bookmarks: string[];
  onToggleBookmark: (slug: string) => void;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");

  const audienceGuides = useMemo(
    () => GUIDES.filter((g) => guideMatchesAudience(g, audience)),
    [audience],
  );

  const visible = useMemo(() => {
    if (category === "all") return audienceGuides;
    if (category === "saved") return audienceGuides.filter((g) => bookmarks.includes(g.slug));
    return audienceGuides.filter((g) => g.category === category);
  }, [audienceGuides, category, bookmarks]);

  const featured = category === "all" ? visible.filter((g) => g.featured) : [];
  const rest = category === "all" ? visible.filter((g) => !g.featured) : visible;
  const savedCount = audienceGuides.filter((g) => bookmarks.includes(g.slug)).length;

  return (
    <div className="space-y-6">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip
          active={category === "all"}
          label="All guides"
          count={audienceGuides.length}
          onClick={() => setCategory("all")}
        />
        {GUIDE_CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            active={category === c.id}
            label={c.label}
            count={audienceGuides.filter((g) => g.category === c.id).length}
            onClick={() => setCategory(c.id)}
          />
        ))}
        <FilterChip
          active={category === "saved"}
          label="Saved"
          count={savedCount}
          onClick={() => setCategory("saved")}
        />
      </div>

      {category !== "all" && category !== "saved" ? (
        <p className="text-[13px] text-muted-foreground">
          {GUIDE_CATEGORIES.find((c) => c.id === category)?.description}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <EmptyNote>
          {category === "saved"
            ? "You haven't saved any guides yet. Use the bookmark on a guide to keep it handy."
            : "No guides match this view. Try another category or audience."}
        </EmptyNote>
      ) : (
        <>
          {featured.length > 0 ? (
            <section aria-label="Featured guides" className="space-y-3">
              <h2 className="text-[13px] font-medium text-foreground">Start here</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {featured.map((g) => (
                  <GuideCard
                    key={g.slug}
                    guide={g}
                    basePath={basePath}
                    completed={completed.includes(g.slug)}
                    bookmarked={bookmarks.includes(g.slug)}
                    onToggleBookmark={onToggleBookmark}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section aria-label="Guides" className="space-y-3">
              {featured.length > 0 ? (
                <h2 className="text-[13px] font-medium text-foreground">All guides</h2>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((g) => (
                  <GuideCard
                    key={g.slug}
                    guide={g}
                    basePath={basePath}
                    completed={completed.includes(g.slug)}
                    bookmarked={bookmarks.includes(g.slug)}
                    onToggleBookmark={onToggleBookmark}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
