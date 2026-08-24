"use client";

import Link from "next/link";
import { Database, Download, Building2, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/data/metric-card";
import { Panel } from "@/components/layout/content-panel";
import { useStatistics } from "@/lib/hooks/useStatistics";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { formatDate } from "@/lib/utils/date";

export function RepositoryDashboard() {
  const { data: stats, isLoading: statsLoading } = useStatistics();
  const { data: datasetsData, isLoading: datasetsLoading } = useDatasets({
    status: "approved",
    sortBy: "download_count",
    sortOrder: "DESC",
    limit: 4,
  });

  const value = (n: number | undefined) =>
    statsLoading || n == null ? "—" : n.toLocaleString();

  // NOTE: organisation names are deliberately not resolved here — GET
  // /organisations requires auth (401 for anonymous visitors), and this
  // section must stay visible on the public, logged-out homepage.
  const topDatasets = datasetsData?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Published datasets"
          value={value(stats?.datasets)}
          icon={Database}
          tone="primary"
        />
        <MetricCard
          label="Total downloads"
          value={statsLoading || stats?.downloads == null ? "—" : stats.downloads.toLocaleString()}
          icon={Download}
          tone="info"
        />
        <MetricCard
          label="Active organisations"
          value={value(stats?.organisations)}
          icon={Building2}
          tone="muted"
        />
        <MetricCard
          label="LGAs covered"
          value={value(stats?.lgasCovered)}
          icon={MapPin}
          tone="success"
        />
      </div>

      <Panel
        title="Most downloaded datasets"
        description="Live statistics from the NSPHCDA data portal"
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
          <p className="text-sm text-muted-foreground">No published datasets yet.</p>
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
    </div>
  );
}
