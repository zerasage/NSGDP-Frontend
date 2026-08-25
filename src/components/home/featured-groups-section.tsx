"use client";

import Link from "next/link";
import { ArrowRight, Database, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/content-panel";
import { useGroups } from "@/lib/hooks/useGroups";

export function FeaturedGroupsSection() {
  const { data, isLoading } = useGroups({ featured: true, limit: 3 });
  const groups = data?.data ?? [];

  if (isLoading || groups.length === 0) return null;

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
      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.slug}`}
            className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-6">{group.name}</h3>
              <Star
                className="size-4 shrink-0 text-warning"
                fill="currentColor"
                aria-hidden
              />
            </div>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {group.description}
            </p>
            <span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="size-3.5" aria-hidden />
              {group.datasetCount} dataset{group.datasetCount !== 1 ? "s" : ""}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
