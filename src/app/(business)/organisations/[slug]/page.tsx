"use client";

import { use, useMemo } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Database } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DatasetCard } from "@/components/data/dataset-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { useOrganisationBySlug } from "@/lib/hooks/useOrganisations";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useCategories } from "@/lib/hooks/useCategories";
import { transformDatasets } from "@/lib/adapters/dataset-adapter";

interface OrganisationPageProps {
  params: Promise<{ slug: string }>;
}

export default function OrganisationPage({ params }: OrganisationPageProps) {
  const { slug } = use(params);

  const { data: organisation, isLoading, error } = useOrganisationBySlug(slug);
  const { data: categoriesResponse } = useCategories();

  const { data: datasetsResponse, isLoading: isDatasetsLoading } = useDatasets(
    organisation
      ? { organisationId: organisation.id, status: "approved", limit: 50 }
      : undefined,
    { enabled: !!organisation }
  );

  const datasets = useMemo(() => {
    if (!datasetsResponse?.data) return [];
    return transformDatasets(datasetsResponse.data, categoriesResponse?.data, [
      organisation,
    ].filter(Boolean) as NonNullable<typeof organisation>[]);
  }, [datasetsResponse, categoriesResponse, organisation]);

  if (isLoading) {
    return (
      <main className="flex-1">
        <Container size="wide" className="py-8">
          <DatasetCardSkeleton />
        </Container>
      </main>
    );
  }

  if (error || !organisation) {
    notFound();
  }

  return (
    <main className="flex-1">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-4" />
            <Link href="/organisations" className="hover:text-foreground">
              Organisations
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{organisation.name}</span>
          </nav>
        </Container>
      </div>

      {/* Header with Brand Color */}
      <div
        className="border-b"
        style={{ backgroundColor: organisation.brandColor || "#6366F1" }}
      >
        <Container size="wide" className="py-12 text-white">
          <div className="flex items-start gap-6">
            {organisation.logoUrl ? (
              <Image
                src={organisation.logoUrl}
                alt=""
                width={80}
                height={80}
                className="rounded-lg bg-white object-cover p-2"
              />
            ) : (
              <div
                className="flex size-20 items-center justify-center rounded-lg bg-white text-4xl font-bold"
                style={{ color: organisation.brandColor || "#6366F1" }}
              >
                {organisation.acronym?.charAt(0) || organisation.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{organisation.name}</h1>
              {organisation.acronym && (
                <p className="mt-1 text-lg opacity-90">{organisation.acronym}</p>
              )}
              <div className="mt-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {organisation.sector}
                </Badge>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/40">
        <Container size="wide" className="py-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Database className="size-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{datasets.length}</span>
              <span className="text-sm text-muted-foreground">
                Dataset{datasets.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {organisation.description && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed">
                    {organisation.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Datasets */}
            <div>
              <h2 className="mb-6 text-2xl font-bold">Datasets</h2>
              {isDatasetsLoading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {[...Array(2)].map((_, i) => (
                    <DatasetCardSkeleton key={i} />
                  ))}
                </div>
              ) : datasets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No datasets available yet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {datasets.map((dataset) => (
                    <DatasetCard key={dataset.id} dataset={dataset} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Sector</p>
                  <p className="mt-1">{organisation.sector}</p>
                </div>
                {organisation.acronym && (
                  <div>
                    <p className="font-medium text-muted-foreground">Acronym</p>
                    <p className="mt-1">{organisation.acronym}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
