"use client";

import Link from "next/link";
import { ArrowRight, Database, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/content-panel";
import { METRIC_TONE } from "@/components/data/metric-card";
import { useGroups } from "@/lib/hooks/useGroups";
import { cn } from "@/lib/utils";

export function FeaturedGroupsSection() {
  const { data, isLoading } = useGroups({ featured: true, limit: 3 });
  const groups = data?.data ?? [];

  return (
    <Panel
      title="Featured collections"
      description="Curated topic collections of datasets and documents"
      action={
        <Link href="/groups">
          <Button variant="outline" size="sm" className="h-9">
            Browse all topics
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading collections…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No featured collections yet.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.slug}`}
              className="rounded-xl border bg-background p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg border",
                    METRIC_TONE.primary.well
                  )}
                >
                  <FolderOpen className={cn("size-4", METRIC_TONE.primary.icon)} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-5">{group.name}</h3>
                  <p className="mt-1 line-clamp-3 text-[13px] text-muted-foreground">
                    {group.description}
                  </p>
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="size-3.5" aria-hidden />
                    {group.datasetCount} dataset{group.datasetCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
