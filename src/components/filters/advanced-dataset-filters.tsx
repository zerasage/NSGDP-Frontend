"use client";

import { FilterSidebar } from "@/components/filters/filter-sidebar";
import {
  DISEASE_FILTER_OPTIONS,
  WARD_FILTER_OPTIONS,
  YEAR_FILTER_OPTIONS,
} from "@/lib/constants/dataset-filters";
import { HEALTH_CATEGORIES } from "@/lib/constants/health";
import { NIGER_STATE_LGAS, FILE_FORMAT_OPTIONS } from "@/lib/constants/core";

export interface AdvancedFilterSection {
  id: string;
  label: string;
  options: Array<{ value: string; label: string; count?: number }>;
}

export function buildAdvancedFilterSections(
  orgs: Array<{ value: string; label: string }>,
  categories: Array<{ value: string; label: string; count?: number }> = []
): AdvancedFilterSection[] {
  // Use real categories if provided, otherwise fall back to mock categories
  const categoryOptions = categories.length > 0
    ? categories
    : HEALTH_CATEGORIES.map((c) => ({
        value: c.id,
        label: `${c.emoji} ${c.label}`,
      }));

  return [
    {
      id: "categories",
      label: "Category",
      options: categoryOptions,
    },
    { id: "organisations", label: "Organisations", options: orgs },
    { id: "lgas", label: "LGAs", options: NIGER_STATE_LGAS.map((l) => ({ value: l, label: l })) },
    { id: "diseases", label: "Disease", options: DISEASE_FILTER_OPTIONS },
    { id: "wards", label: "Ward", options: WARD_FILTER_OPTIONS },
    { id: "years", label: "Year", options: YEAR_FILTER_OPTIONS },
    { id: "formats", label: "Formats", options: FILE_FORMAT_OPTIONS },
  ];
}

interface AdvancedDatasetFiltersProps {
  filters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  orgs: Array<{ value: string; label: string }>;
  categoryOptions?: Array<{ value: string; label: string; count?: number }>;
  className?: string;
}

/** Unified advanced filter sidebar — all filter dimensions in one bar */
export function AdvancedDatasetFilters({
  filters,
  onFilterChange,
  orgs,
  categoryOptions,
  className,
}: AdvancedDatasetFiltersProps) {
  return (
    <FilterSidebar
      filters={filters}
      onFilterChange={onFilterChange}
      sections={buildAdvancedFilterSections(orgs, categoryOptions)}
      className={className}
    />
  );
}
