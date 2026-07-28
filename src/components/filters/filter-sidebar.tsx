"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FilterSection {
  id: string;
  label: string;
  options: Array<{ value: string; label: string; count?: number }>;
}

interface FilterSidebarProps {
  filters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  sections: FilterSection[];
  className?: string;
}

const DEFAULT_VISIBLE_OPTIONS = 8;

export function FilterSidebar({
  filters,
  onFilterChange,
  sections,
  className,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [showAllSections, setShowAllSections] = useState<Set<string>>(new Set());

  const toggleShowAll = (sectionId: string) => {
    setShowAllSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleCheckboxChange = (sectionId: string, value: string, checked: boolean) => {
    const currentValues = filters[sectionId] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onFilterChange(sectionId, newValues);
  };

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  const clearAll = () => {
    sections.forEach((section) => {
      onFilterChange(section.id, []);
    });
  };

  return (
    <aside className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const activeCount = (filters[section.id] || []).length;

        return (
          <div key={section.id} className="border-b pb-4 last:border-b-0">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary"
            >
              <span className="flex items-center gap-2">
                {section.label}
                {activeCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </span>
              {isExpanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {/* Section Options */}
            {isExpanded && (() => {
              const showAll = showAllSections.has(section.id) || section.options.length <= DEFAULT_VISIBLE_OPTIONS;
              const visibleOptions = showAll
                ? section.options
                : section.options.slice(0, DEFAULT_VISIBLE_OPTIONS);
              const hiddenCount = section.options.length - visibleOptions.length;

              return (
                <div className="mt-2 space-y-2">
                  {visibleOptions.map((option) => {
                    const isChecked = (filters[section.id] || []).includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:text-primary"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(section.id, option.value, checked === true)
                          }
                        />
                        <span className="flex-1 text-sm">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="ml-1 text-muted-foreground">
                              ({option.count})
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleShowAll(section.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Show {hiddenCount} more
                    </button>
                  )}
                  {showAll && section.options.length > DEFAULT_VISIBLE_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => toggleShowAll(section.id)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Show less
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </aside>
  );
}
