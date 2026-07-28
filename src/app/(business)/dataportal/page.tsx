"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Database, Search, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { GeoHealthDatasetCard } from "@/components/data/geohealth-dataset-card";
import { DatasetDetailModal } from "@/components/data/dataset-detail-modal";
import {
  AdvancedDatasetFilters,
  buildAdvancedFilterSections,
} from "@/components/filters/advanced-dataset-filters";
import { MobileFilterDrawer } from "@/components/filters/mobile-filter-drawer";
import { ActiveFilterChips } from "@/components/filters/active-filter-chips";
import { EmptyState } from "@/components/feedback/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/data/pagination";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { DEFAULT_PORTAL_FILTERS } from "@/lib/constants/dataset-filters";
import { useCategories } from "@/lib/hooks/useCategories";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { transformDatasets } from "@/lib/adapters/dataset-adapter";
import { cn } from "@/lib/utils";
import type { DatasetListParams, DatasetFormat } from "@/lib/api/datasets";
import type { Dataset } from "@/types";

type SortOption = "recent" | "popular" | "name";

function DataportalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalDataset, setModalDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>(DEFAULT_PORTAL_FILTERS);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput, 400);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  // Fetch real categories from API
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();

  // Fetch real organisations from API
  const { data: organisationsResponse, isLoading: organisationsLoading } = useOrganisations(1, 100);

  // Build API query parameters from filters
  const datasetParams: DatasetListParams = useMemo(() => {
    const params: DatasetListParams = {
      page,
      limit: pageSize,
      status: 'approved', // Only show approved datasets in public portal
      search: searchQuery || undefined, // Add search parameter
    };

    // Map sort options to API parameters
    if (sort === 'recent') {
      params.sortBy = 'created_at';
      params.sortOrder = 'DESC';
    } else if (sort === 'popular') {
      params.sortBy = 'download_count';
      params.sortOrder = 'DESC';
    } else if (sort === 'name') {
      params.sortBy = 'title';
      params.sortOrder = 'ASC';
    }

    // Convert category slug to ID (backend expects categoryId UUID)
    // For now, we'll need to look up the category ID from the slug
    if (filters.categories.length > 0 && categoriesResponse?.data) {
      const categorySlug = filters.categories[0]; // Backend accepts single category
      const category = categoriesResponse.data.find((c) => c.slug === categorySlug);
      if (category) {
        params.categoryId = category.id;
      }
    }

    // Convert organisation slug to ID (backend expects organisationId UUID)
    if (filters.organisations.length > 0 && organisationsResponse?.data) {
      const orgSlug = filters.organisations[0]; // Backend accepts single org
      const org = organisationsResponse.data.find((o) => o.slug === orgSlug);
      if (org) {
        params.organisationId = org.id;
      }
    }

    // Map format filter (backend accepts single format)
    if (filters.formats.length > 0) {
      params.format = filters.formats[0] as DatasetFormat;
    }

    // Map LGA filter (backend accepts single lga)
    if (filters.lgas.length > 0) {
      params.lga = filters.lgas[0];
    }

    // Map ward filter (backend accepts single ward)
    if (filters.wards.length > 0) {
      params.ward = filters.wards[0];
    }

    // Map disease filter (backend accepts single disease indicator)
    if (filters.diseases.length > 0) {
      params.diseaseIndicators = filters.diseases[0];
    }

    // Map year filter to a date range (backend accepts dateFrom/dateTo, not
    // discrete years) — spans the earliest to latest selected year.
    if (filters.years.length > 0) {
      const years = filters.years.map(Number).sort((a, b) => a - b);
      params.dateFrom = `${years[0]}-01-01`;
      params.dateTo = `${years[years.length - 1]}-12-31`;
    }

    return params;
  }, [page, pageSize, sort, filters, categoriesResponse, organisationsResponse, searchQuery]);

  // Fetch datasets from real API. keepPreviousData avoids a jarring
  // skeleton wipe on every filter/page/search change — the previous
  // results stay on screen (dimmed via isRefetching) until the new page
  // of results is ready.
  const { data: datasetsData, isLoading: datasetsLoading, isFetching: datasetsFetching } = useDatasets(
    datasetParams,
    { keepPreviousData: true }
  );

  // Transform backend datasets to frontend format
  const datasets = useMemo(() => {
    if (!datasetsData?.data) return [];
    return transformDatasets(
      datasetsData.data,
      categoriesResponse?.data,
      organisationsResponse?.data
    );
  }, [datasetsData, categoriesResponse, organisationsResponse]);

  const total = datasetsData?.meta.total || 0;
  const totalPages = datasetsData?.meta.totalPages || 1;

  // Build category options from real API data
  const categoryOptions = useMemo(() => {
    if (!categoriesResponse?.data) return [];
    return categoriesResponse.data
      .filter((cat) => cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => ({
        value: cat.slug,
        label: cat.name,
        count: cat.datasetCount,
      }));
  }, [categoriesResponse]);

  // Build organisation options from real API data
  const orgOptions = useMemo(() => {
    if (!organisationsResponse?.data) return [];
    return organisationsResponse.data
      .filter((org) => org.isActive)
      .map((org) => ({
        value: org.slug,
        label: org.name,
      }));
  }, [organisationsResponse]);

  useEffect(() => {
    if (searchParams) {
      setPage(Number(searchParams.get("page")) || 1);
      setPageSize(Number(searchParams.get("limit")) || 20);
      setSort((searchParams.get("sort") as SortOption) || "recent");
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (sort !== "recent") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("limit", String(pageSize));
    router.replace(params.toString() ? `/dataportal?${params}` : "/dataportal", { scroll: false });
  }, [sort, page, pageSize, router]);

  // Reset to page 1 once the debounced search term settles (skip the
  // mount-time run so it doesn't clobber a page restored from the URL).
  const isFirstSearchRender = useRef(true);
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    setPage(1);
  }, [searchQuery]);

  const scrollToResults = () => {
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isLoading = datasetsLoading || categoriesLoading || organisationsLoading;
  const isRefetching = datasetsFetching && !datasetsLoading;

  const filterSections = buildAdvancedFilterSections(orgOptions, categoryOptions);

  const activeChips = Object.entries(filters).flatMap(([filterId, values]) =>
    values.map((value) => ({
      filterId,
      value,
      label: filterSections.find((s) => s.id === filterId)?.options.find((o) => o.value === value)?.label ?? value,
    }))
  );

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-8">
          <h1 className="text-3xl font-bold">Health Data Portal</h1>
          <p className="mt-2 text-muted-foreground">
            Browse {total} health datasets from NSPHCDA and partner organisations
          </p>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="flex gap-8">
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-6">
              <AdvancedDatasetFilters
                filters={filters}
                onFilterChange={(id, vals) => {
                  setFilters((p) => ({ ...p, [id]: vals }));
                  setPage(1);
                  scrollToResults();
                }}
                orgs={orgOptions}
                categoryOptions={categoryOptions}
              />
            </div>
          </div>

          <div ref={resultsTopRef} className="flex-1 min-w-0 scroll-mt-20">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search datasets by title or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-9"
              />
              {searchInput !== searchQuery && (
                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <ActiveFilterChips
              chips={activeChips}
              onRemove={(id, val) =>
                setFilters((p) => ({ ...p, [id]: p[id].filter((v) => v !== val) }))
              }
              onClearAll={() => setFilters(DEFAULT_PORTAL_FILTERS)}
              className="mb-4"
            />

            <div className="flex items-center justify-between mb-6 gap-4">
              <p className="text-sm font-medium flex items-center gap-2">
                {isLoading ? "Loading…" : `${total} datasets found`}
                {isRefetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              </p>
              <div className="flex items-center gap-2">
                <MobileFilterDrawer
                  filters={filters}
                  onFilterChange={(id, vals) => {
                    setFilters((p) => ({ ...p, [id]: vals }));
                    setPage(1);
                  }}
                  sections={filterSections}
                />
                <Select value={sort} onValueChange={(v) => v && setSort(v as SortOption)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Downloaded</SelectItem>
                    <SelectItem value="name">Alphabetical A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <DatasetCardSkeleton key={i} />
                ))}
              </div>
            ) : datasets.length === 0 ? (
              <EmptyState
                icon={Database}
                title="No datasets found"
                description="Try adjusting your filter selections"
                action={{
                  label: "Clear filters",
                  onClick: () => setFilters(DEFAULT_PORTAL_FILTERS),
                }}
              />
            ) : (
              <>
                <div
                  className={cn(
                    "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200",
                    isRefetching && "opacity-60"
                  )}
                >
                  {datasets.map((d, i) => (
                    <div
                      key={d.id}
                      className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both"
                      style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationDuration: "300ms" }}
                    >
                      <GeoHealthDatasetCard dataset={d} onInfoClick={setModalDataset} />
                    </div>
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={(p) => {
                    setPage(p);
                    scrollToResults();
                  }}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setPage(1);
                    scrollToResults();
                  }}
                  className="mt-8"
                />
              </>
            )}
          </div>
        </div>
      </Container>

      <DatasetDetailModal
        dataset={modalDataset}
        open={!!modalDataset}
        onOpenChange={(o) => !o && setModalDataset(null)}
      />

      <ScrollToTopButton />
    </main>
  );
}

export default function DataportalPage() {
  return (
    <Suspense>
      <DataportalContent />
    </Suspense>
  );
}
