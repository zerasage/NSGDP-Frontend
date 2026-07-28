"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Database, Building2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DatasetCard } from "@/components/data/dataset-card";
import { OrgCard } from "@/components/data/org-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { DatasetCardSkeleton, OrgCardSkeleton } from "@/components/feedback/skeletons";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchAll } from "@/lib/api/search";
import { adaptSearchResultToDataset, adaptSearchResultToOrganisation } from "@/lib/adapters/search-adapter";
import type { Dataset, Organisation } from "@/types";

type Tab = "all" | "dataset" | "organisation";
type SearchResult = { type: "dataset" | "organisation"; item: Dataset | Organisation };

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [tab, setTab] = useState<Tab>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryInput, setQueryInput] = useState(q);

  // Keep the input in sync when q changes from outside this page (e.g. a
  // fresh /search?q=... link), without clobbering what the user is typing.
  useEffect(() => {
    setQueryInput(q);
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchAll(q).then((data) => {
      setResults(
        data.results.map((r) =>
          r.type === "organisation"
            ? { type: "organisation" as const, item: adaptSearchResultToOrganisation(r) }
            : { type: "dataset" as const, item: adaptSearchResultToDataset(r) }
        )
      );
      setLoading(false);
    });
  }, [q]);

  const counts = {
    all: results.length,
    dataset: results.filter((r) => r.type === "dataset").length,
    organisation: results.filter((r) => r.type === "organisation").length,
  };

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "dataset", label: "Datasets", count: counts.dataset },
    { key: "organisation", label: "Organisations", count: counts.organisation },
  ];

  const displayResults = tab === "all"
    ? results
    : results.filter((r) => r.type === tab);

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Search Results</h1>
              <p className="mt-2 text-muted-foreground">
                {q ? `Results for "${q}"` : "Enter a search term to find datasets and organisations"}
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto sm:min-w-80">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search datasets and organisations..."
                  className="pl-10"
                  aria-label="Search datasets and organisations"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        {!q.trim() ? (
          <EmptyState
            icon={Search}
            title="Start searching"
            description="Use the search bar in the navigation to find data across the portal"
            action={{ label: "Browse datasets", href: "/dataportal" }}
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-8 border-b pb-4">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    tab === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.label}
                  <span className="ml-2 text-xs opacity-80">({t.count})</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) =>
                  i % 2 === 0 ? (
                    <DatasetCardSkeleton key={i} />
                  ) : (
                    <OrgCardSkeleton key={i} />
                  )
                )}
              </div>
            ) : displayResults.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No results found"
                description={`Nothing matched "${q}". Try different keywords or browse the catalogue.`}
                action={{ label: "Browse all datasets", href: "/dataportal" }}
              />
            ) : (
              <div className="space-y-8">
                {(tab === "all" || tab === "dataset") && counts.dataset > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Database className="size-5" />
                      Datasets ({counts.dataset})
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {results
                        .filter((r) => r.type === "dataset")
                        .map((r) => (
                          <DatasetCard key={(r.item as Dataset).id} dataset={r.item as Dataset} />
                        ))}
                    </div>
                  </section>
                )}

                {(tab === "all" || tab === "organisation") && counts.organisation > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="size-5" />
                      Organisations ({counts.organisation})
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {results
                        .filter((r) => r.type === "organisation")
                        .map((r) => (
                          <OrgCard key={(r.item as Organisation).id} organisation={r.item as Organisation} />
                        ))}
                    </div>
                  </section>
                )}

              </div>
            )}

            {!loading && displayResults.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Can&apos;t find what you need?
                </p>
                <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }))}>
                  Contact the data team
                </Link>
              </div>
            )}
          </>
        )}
      </Container>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="flex-1">
        <Container size="wide" className="py-12">
          <h1 className="text-3xl font-bold">Search Results</h1>
          <p className="mt-2 text-muted-foreground">Loading…</p>
        </Container>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}
