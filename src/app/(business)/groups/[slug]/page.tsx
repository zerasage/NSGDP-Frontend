"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Database, FileText, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGroupBySlug } from "@/lib/hooks/useGroups";

interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

const GRADIENT_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-teal-500 to-green-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-green-500",
];

export default function GroupPage({ params }: GroupPageProps) {
  const { slug } = use(params);
  const { data: group, isLoading, error } = useGroupBySlug(slug);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (error) {
    notFound();
  }

  if (!group) return null;

  const gradientIndex = parseInt(group.id.replace(/\D/g, "")) % GRADIENT_COLORS.length;
  const gradientClass = GRADIENT_COLORS[gradientIndex] ?? GRADIENT_COLORS[0];

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-4" />
            <Link href="/groups" className="hover:text-foreground">
              Topics
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{group.name}</span>
          </nav>
        </Container>
      </div>

      <div className="relative h-48 overflow-hidden border-b">
        <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <Container size="wide" className="absolute inset-0 flex flex-col justify-end pb-8">
          <h1 className="text-4xl font-bold text-white">{group.name}</h1>
          {group.description && (
            <p className="mt-2 max-w-2xl text-white/90">{group.description}</p>
          )}
        </Container>
      </div>

      <div className="border-b bg-muted/40">
        <Container size="wide" className="flex flex-wrap gap-8 py-6">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{group.datasets.length}</span>
            <span className="text-sm text-muted-foreground">
              Dataset{group.datasets.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{group.documents.length}</span>
            <span className="text-sm text-muted-foreground">
              Document{group.documents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </Container>
      </div>

      <Container size="wide" className="space-y-10 py-12">
        <section>
          <h2 className="mb-4 text-xl font-semibold">Datasets</h2>
          {group.datasets.length === 0 ? (
            <p className="text-muted-foreground">No datasets in this collection yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.datasets.map((dataset) => (
                <Link key={dataset.id} href={`/dataportal/${dataset.slug}`}>
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardContent className="flex h-full flex-col gap-2 pt-6">
                      <p className="line-clamp-2 font-medium leading-snug">{dataset.title}</p>
                      <Badge variant="secondary" className="w-fit text-[11px] uppercase">
                        {dataset.format}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Documents</h2>
          {group.documents.length === 0 ? (
            <p className="text-muted-foreground">No documents in this collection yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="flex flex-col gap-2 pt-6">
                    <p className="line-clamp-2 font-medium leading-snug">{doc.title}</p>
                    <Badge variant="secondary" className="w-fit text-[11px] uppercase">
                      {doc.type}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
