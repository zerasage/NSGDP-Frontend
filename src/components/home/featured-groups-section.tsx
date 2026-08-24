"use client";

import Link from "next/link";
import { ArrowRight, Database, Star } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/lib/hooks/useGroups";

export function FeaturedGroupsSection() {
  const { data, isLoading } = useGroups({ featured: true, limit: 3 });
  const groups = data?.data ?? [];

  if (isLoading || groups.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <Container size="wide">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Featured Collections</h2>
            <p className="mt-2 text-muted-foreground">
              Curated topic collections of datasets and documents
            </p>
          </div>
          <Link href="/groups">
            <Button variant="outline">
              Browse all topics
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.slug}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="flex h-full flex-col gap-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{group.name}</h3>
                    <Star className="size-4 shrink-0 fill-amber-400 text-amber-400" />
                  </div>
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {group.description}
                  </p>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Database className="size-3.5" />
                    {group.datasetCount} dataset{group.datasetCount !== 1 ? "s" : ""}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
