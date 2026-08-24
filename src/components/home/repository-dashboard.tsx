"use client";

import Link from "next/link";
import { Database, Download, Building2, MapPin, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { statusIconBg } from "@/lib/constants/status-surfaces";
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

  const statItems = [
    { icon: Database, value: stats?.datasets, label: "Published Datasets", iconClass: statusIconBg.primary },
    { icon: Download, value: stats?.downloads?.toLocaleString(), label: "Total Downloads", iconClass: statusIconBg.emerald },
    { icon: Building2, value: stats?.organisations, label: "Active Organisations", iconClass: statusIconBg.blue },
    { icon: MapPin, value: stats?.lgasCovered, label: "LGAs Covered", iconClass: statusIconBg.amber },
  ];

  // NOTE: organisation names are deliberately not resolved here — GET
  // /organisations requires auth (401 for anonymous visitors), and this
  // section must stay visible on the public, logged-out homepage.
  const topDatasets = datasetsData?.data ?? [];

  return (
    <section className="py-12 border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold">Repository at a Glance</h2>
            <p className="text-muted-foreground mt-1">Live statistics from the NSPHCDA Data Portal</p>
          </div>
          <Link href="/dataportal">
            <Button variant="outline" size="sm">
              Browse All Datasets
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-5 flex items-center gap-4">
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}>
                  <stat.icon className="size-5" aria-hidden />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {statsLoading || stat.value == null ? "—" : stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Most downloaded */}
        <Card>
          <div className="px-5 py-4 border-b">
            <p className="font-semibold text-sm">Most Downloaded Datasets</p>
          </div>
          {datasetsLoading ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : topDatasets.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No published datasets yet</p>
          ) : (
            <ul className="divide-y">
              {topDatasets.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <Database className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dataportal/${item.slug}`}
                      className="text-sm font-medium hover:text-primary hover:underline truncate block"
                    >
                      {item.title}
                    </Link>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.updated_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
