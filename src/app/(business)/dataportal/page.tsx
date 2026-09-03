"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckSquare, Database, Download, Loader2, Search, X } from "lucide-react";
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
import { LoginPromptModal } from "@/components/feedback/login-prompt-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/data/pagination";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { DEFAULT_PORTAL_FILTERS } from "@/lib/constants/dataset-filters";
import { useCategories } from "@/lib/hooks/useCategories";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useBulkDownloadDatasets, useDatasets } from "@/lib/hooks/useDatasets";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { transformDatasets } from "@/lib/adapters/dataset-adapter";
import { useAuth } from "@/lib/auth";
import { BULK_DOWNLOAD_MAX_DATASETS } from "@/lib/api/datasets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DatasetListParams, DatasetFormat } from "@/lib/api/datasets";
import type { Dataset } from "@/types";

type SortOption = "recent" | "popular" | "name";

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DataportalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const bulkDownloadMutation = useBulkDownloadDatasets();
  const [modalDataset, setModalDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>(DEFAULT_PORTAL_FILTERS);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebouncedValue(searchInput, 400);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);

  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const { data: organisationsResponse, isLoading: organisationsLoading } = useOrganisations(1, 100);

  const datasetParams: DatasetListParams = useMemo(() => {
    const params: DatasetListParams = {
      page,
      limit: pageSize,
      status: "approved",
      search: searchQuery || undefined,
    };

    if (sort === "recent") {
      params.sortBy = "created_at";
      params.sortOrder = "DESC";
    } else if (sort === "popular") {
      params.sortBy = "download_count";
      params.sortOrder = "DESC";
    } else if (sort === "name") {
      params.sortBy = "title";
      params.sortOrder = "ASC";
    }

    if (filters.categories.length > 0 && categoriesResponse?.data) {
      const categorySlug = filters.categories[0];
      const category = categoriesResponse.data.find((c) => c.slug === categorySlug);
      if (category) {
        params.categoryId = category.id;
      }
    }

    if (filters.organisations.length > 0 && organisationsResponse?.data) {
      const orgSlug = filters.organisations[0];
      const org = organisationsResponse.data.find((o) => o.slug === orgSlug);
      if (org) {
        params.organisationId = org.id;
      }
    }

    if (filters.formats.length > 0) {
      params.format = filters.formats[0] as DatasetFormat;
    }

    if (filters.lgas.length > 0) {
      params.lga = filters.lgas[0];
    }

    if (filters.wards.length > 0) {
      params.ward = filters.wards[0];
    }

    if (filters.diseases.length > 0) {
      params.diseaseIndicators = filters.diseases[0];
    }

    if (filters.years.length > 0) {
      const years = filters.years.map(Number).sort((a, b) => a - b);
      params.dateFrom = `${years[0]}-01-01`;
      params.dateTo = `${years[years.length - 1]}-12-31`;
    }

    return params;
  }, [page, pageSize, sort, filters, categoriesResponse, organisationsResponse, searchQuery]);

  const { data: datasetsData, isLoading: datasetsLoading, isFetching: datasetsFetching } = useDatasets(
    datasetParams,
    { keepPreviousData: true }
  );

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

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedSlugs([]);
  };

  const enterSelectionMode = () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setSelectionMode(true);
  };

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= BULK_DOWNLOAD_MAX_DATASETS) {
        toast.error(`You can select at most ${BULK_DOWNLOAD_MAX_DATASETS} datasets`);
        return prev;
      }
      return [...prev, slug];
    });
  };

  const selectVisible = () => {
    const visible = datasets.map((d) => d.slug);
    setSelectedSlugs((prev) => {
      const merged = [...new Set([...prev, ...visible])];
      if (merged.length > BULK_DOWNLOAD_MAX_DATASETS) {
        toast.error(`You can select at most ${BULK_DOWNLOAD_MAX_DATASETS} datasets`);
        return merged.slice(0, BULK_DOWNLOAD_MAX_DATASETS);
      }
      return merged;
    });
  };

  const handleBulkDownload = () => {
    if (selectedSlugs.length === 0) {
      toast.error("Select at least one dataset");
      return;
    }
    bulkDownloadMutation.mutate(selectedSlugs, {
      onSuccess: (result) => {
        triggerBrowserDownload(result.blob, result.fileName);
        if (result.skippedCount > 0) {
          toast.success(
            `Downloaded ${result.includedCount} dataset${result.includedCount === 1 ? "" : "s"} (${result.skippedCount} skipped — see _download-report.json in the ZIP)`
          );
        } else {
          toast.success(
            `Downloaded ${result.includedCount} dataset${result.includedCount === 1 ? "" : "s"} as ZIP`
          );
        }
        exitSelectionMode();
      },
      onError: (error: Error) => {
        toast.error(error.message || "Bulk download failed");
      },
    });
  };

  const isLoading = datasetsLoading || categoriesLoading || organisationsLoading;
  const isRefetching = datasetsFetching && !datasetsLoading;

  const filterSections = buildAdvancedFilterSections(orgOptions, categoryOptions);

  const activeChips = Object.entries(filters).flatMap(([filterId, values]) =>
    values.map((value) => ({
      filterId,
      value,
      label:
        filterSections.find((s) => s.id === filterId)?.options.find((o) => o.value === value)?.label ??
        value,
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

      <Container
        size="wide"
        className={cn("py-8", selectionMode && selectedSlugs.length > 0 && "pb-28")}
      >
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden w-64 shrink-0 lg:block">
            <AdvancedDatasetFilters
              filters={filters}
              onFilterChange={(id, vals) => {
                setFilters((p) => ({ ...p, [id]: vals }));
                setPage(1);
              }}
              orgs={orgOptions}
              categoryOptions={categoryOptions}
            />
          </aside>

          <div className="min-w-0 flex-1" ref={resultsTopRef}>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search datasets…"
                className="pl-9"
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

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                {isLoading ? "Loading…" : `${total} datasets found`}
                {isRefetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {selectionMode ? (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={selectVisible}>
                      Select page
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={exitSelectionMode}>
                      <X className="size-4" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={enterSelectionMode}>
                    <CheckSquare className="size-4" />
                    Select
                  </Button>
                )}
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

            {selectionMode && (
              <p className="mb-4 text-sm text-muted-foreground">
                Select up to {BULK_DOWNLOAD_MAX_DATASETS} datasets you can access, then download them
                as one ZIP. Restricted datasets without approved access are skipped.
              </p>
            )}

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
                      style={{
                        animationDelay: `${Math.min(i, 8) * 40}ms`,
                        animationDuration: "300ms",
                      }}
                    >
                      <GeoHealthDatasetCard
                        dataset={d}
                        onInfoClick={setModalDataset}
                        selectionMode={selectionMode}
                        selected={selectedSlugs.includes(d.slug)}
                        onToggleSelect={toggleSelect}
                      />
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

      {selectionMode && selectedSlugs.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Container size="wide" className="flex items-center justify-between gap-4 py-3">
            <p className="text-sm font-medium">
              {selectedSlugs.length} selected
              <span className="font-normal text-muted-foreground">
                {" "}
                / {BULK_DOWNLOAD_MAX_DATASETS} max
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedSlugs([])}>
                Clear
              </Button>
              <Button
                type="button"
                onClick={handleBulkDownload}
                disabled={bulkDownloadMutation.isPending}
              >
                {bulkDownloadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                {bulkDownloadMutation.isPending
                  ? "Preparing ZIP…"
                  : `Download ZIP (${selectedSlugs.length})`}
              </Button>
            </div>
          </Container>
        </div>
      )}

      <DatasetDetailModal
        dataset={modalDataset}
        open={!!modalDataset}
        onOpenChange={(open) => {
          if (!open) setModalDataset(null);
        }}
      />

      <LoginPromptModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        redirectAfterAuth="/dataportal"
        title="Log in to select datasets"
        description="Create a free account or log in to bulk-download datasets as a ZIP."
      />

      <ScrollToTopButton />
    </main>
  );
}

export default function DataportalPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1">
          <Container size="wide" className="py-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <DatasetCardSkeleton key={i} />
              ))}
            </div>
          </Container>
        </main>
      }
    >
      <DataportalContent />
    </Suspense>
  );
}
