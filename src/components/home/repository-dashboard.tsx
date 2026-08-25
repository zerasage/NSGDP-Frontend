"use client";

import Link from "next/link";
import { Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/content-panel";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { formatDate } from "@/lib/utils/date";

export function RepositoryDashboard() {
  const { data: datasetsData, isLoading: datasetsLoading } = useDatasets({
    status: "approved",
    sortBy: "download_count",
    sortOrder: "DESC",
    limit: 4,
  });

  // NOTE: organisation names are deliberately not resolved here — GET
  // /organisations requires auth (401 for anonymous visitors), and this
  // section must stay visible on the public, logged-out homepage.
  const topDatasets = datasetsData?.data ?? [];

  return (
    <Panel
      title="Most downloaded datasets"
      description="Live catalogue from published NSPHCDA datasets"
      action={
        <Link href="/dataportal">
          <Button variant="outline" size="sm" className="h-9">
            Browse all datasets
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      }
    >
      {datasetsLoading ? (
        <p className="text-sm text-muted-foreground">Loading published datasets…</p>
      ) : topDatasets.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No published datasets yet.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {topDatasets.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
            >
              <Database className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dataportal/${item.slug}`}
                  className="block truncate text-sm font-medium hover:text-primary hover:underline"
                >
                  {item.title}
                </Link>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatDate(item.updated_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
