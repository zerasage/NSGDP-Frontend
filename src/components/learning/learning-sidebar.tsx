"use client";

import { cn } from "@/lib/utils";
import type { AudienceFilter } from "@/lib/learning/types";

export interface SidebarSection {
  id: string;
  label: string;
  count?: number;
}

export interface SidebarCategory {
  id: string;
  label: string;
  count: number;
}

/**
 * Content for the desktop (lg+) side panel: audience filter, section nav,
 * and — when the Guides section is active — a nested category list. The
 * positioned/scrollable `<aside>` wrapper lives in LearningShell (docs-style
 * sticky column); this component only renders what goes inside it. Below lg
 * the main content area falls back to its own inline horizontal controls
 * (segmented tabs / filter chips) instead of this, since there's no room for
 * a side column; both read/write the same lifted state in LearningHubInner.
 */
export function LearningSidebar({
  audiences,
  audience,
  onAudienceChange,
  sections,
  activeSection,
  onSectionChange,
  categories,
  activeCategory,
  onCategoryChange,
}: {
  audiences: Array<{ id: AudienceFilter; label: string }>;
  audience: AudienceFilter;
  onAudienceChange: (id: AudienceFilter) => void;
  sections: SidebarSection[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  categories?: SidebarCategory[];
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-foreground">
          Viewing as
        </h2>
        <div className="space-y-0.5">
          {audiences.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onAudienceChange(a.id)}
              aria-pressed={a.id === audience}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                a.id === audience
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground/80 hover:transition-none",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-foreground">
          Browse
        </h2>
        <nav className="space-y-0.5" aria-label="Learning hub sections">
          {sections.map((s) => {
            const active = s.id === activeSection;
            return (
              <div key={s.id}>
                <button
                  type="button"
                  onClick={() => onSectionChange(s.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground/80 hover:transition-none",
                  )}
                >
                  <span>{s.label}</span>
                  {s.count != null ? (
                    <span className={cn("tabular-nums text-xs", active ? "opacity-90" : "opacity-60")}>
                      {s.count}
                    </span>
                  ) : null}
                </button>

                {active && categories && categories.length > 0 ? (
                  <div className="ml-3 mt-1 space-y-0.5 border-l pl-2.5">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onCategoryChange?.(c.id)}
                        aria-pressed={c.id === activeCategory}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors",
                          c.id === activeCategory
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground/80 hover:transition-none",
                        )}
                      >
                        <span>{c.label}</span>
                        <span className="tabular-nums text-xs opacity-60">{c.count}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
