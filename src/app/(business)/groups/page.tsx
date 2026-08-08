"use client";

import { Container } from "@/components/layout/container";
import { GroupTile } from "@/components/data/group-tile";
import { GroupTileSkeleton } from "@/components/feedback/skeletons";
import { useGroups } from "@/lib/hooks/useGroups";

export default function GroupsPage() {
  const { data, isLoading, error } = useGroups();
  const groups = data?.data ?? [];

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-8">
          <h1 className="text-3xl font-bold">Topics</h1>
          <p className="mt-2 text-muted-foreground">
            Explore datasets organized by thematic areas
          </p>
        </Container>
      </div>

      <Container size="wide" className="py-12">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <GroupTileSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="py-12 text-center text-muted-foreground">
            Couldn&apos;t load topics. Please try again shortly.
          </p>
        ) : groups.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No topics have been curated yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <GroupTile
                key={group.id}
                group={{
                  id: group.id,
                  slug: group.slug,
                  name: group.name,
                  description: group.description,
                  datasetCount: group.datasetCount,
                }}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
