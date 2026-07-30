"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, ChevronRight, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Container } from "@/components/layout/container";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetDownloadActions } from "@/components/data/dataset-download-actions";
import { DatasetMapSection } from "@/components/data/dataset-map-section";
import { DatasetActivityPanel } from "@/components/data/dataset-activity-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataset, useDatasets, useDatasetPreview } from "@/lib/hooks/useDatasets";
import { usePublicDatasetPreview } from "@/lib/hooks/usePublicDatasetPreview";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/hooks/useCategories";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { transformDataset } from "@/lib/adapters/dataset-adapter";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { SPATIAL_ONLY_PREVIEW_FORMATS } from "@/lib/constants/core";
import type { PaginatedResponse } from "@/lib/types/common";
import type { Category } from "@/lib/api/categories";
import type { Organisation } from "@/lib/api/organisations";

interface DatasetPageProps {
  params: Promise<{ slug: string }>;
}

export default function DatasetPage({ params }: DatasetPageProps) {
  const { slug } = use(params);
  
  // Fetch dataset by slug (public endpoint — now also returns restricted
  // datasets as metadata-only, so this can 200 even without access)
  const { data: backendDataset, isLoading, error } = useDataset(slug);
  const { isAuthenticated } = useAuth();

  // The public preview endpoint only ever serves visibility:"public"
  // datasets — for restricted/private ones it always 403s, so route those
  // through the authenticated endpoint instead, which respects hasAccess
  // (same-org member, approved requester, super_admin, or staff grant).
  const isRestrictedOrPrivate =
    backendDataset?.visibility === "restricted" || backendDataset?.visibility === "private";
  const { data: publicPreviewData, isLoading: isPublicPreviewLoading } = usePublicDatasetPreview(
    slug,
    !!backendDataset && !isRestrictedOrPrivate
  );
  const {
    data: authPreviewData,
    isLoading: isAuthPreviewLoading,
    error: authPreviewError,
  } = useDatasetPreview(slug, !!backendDataset && isRestrictedOrPrivate && isAuthenticated);

  const previewData = isRestrictedOrPrivate ? authPreviewData : publicPreviewData;
  const isPreviewLoading = isRestrictedOrPrivate
    ? isAuthenticated && isAuthPreviewLoading
    : isPublicPreviewLoading;
  // 403 from the authenticated endpoint means "no access yet", not "broken
  // file" — the generic fallback message would be misleading here.
  const previewBlocked = isRestrictedOrPrivate && (!isAuthenticated || !!authPreviewError);
  
  // Fetch reference data for transformation
  const { data: categoriesResponse } = useCategories() as { data?: PaginatedResponse<Category> };
  const { data: organisationsResponse } = useOrganisations(1, 100) as { data?: PaginatedResponse<Organisation> };
  
  // Transform backend dataset to frontend format
  const dataset = backendDataset
    ? transformDataset(backendDataset, categoriesResponse?.data ?? [], organisationsResponse?.data ?? [])
    : null;
  
  // Fetch related datasets (same category)
  const { data: relatedData } = useDatasets(
    dataset?.healthCategory && backendDataset?.category_id
      ? {
          categoryId: backendDataset.category_id,
          limit: 4,
          status: 'approved',
        }
      : undefined
  );
  
  const relatedDatasets = relatedData?.data
    ? relatedData.data
        .filter((d) => d.id !== dataset?.id)
        .slice(0, 3)
        .map((d) => transformDataset(d, categoriesResponse?.data ?? [], organisationsResponse?.data ?? []))
    : [];

  if (isLoading) {
    return (
      <main className="flex-1">
        <Container size="wide" className="py-8">
          <DatasetCardSkeleton />
        </Container>
      </main>
    );
  }

  if (error || !dataset) {
    notFound();
  }

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

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
            <Link href="/dataportal" className="hover:text-foreground">
              Data Portal
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{dataset.title}</span>
          </nav>
        </Container>
      </div>

      {/* Header */}
      <div className="border-b bg-background">
        <Container size="wide" className="py-8">
          <div className="flex items-start gap-4">
            {/* Organisation Logo */}
            {dataset.organisation.logoUrl ? (
              <Image
                src={dataset.organisation.logoUrl}
                alt=""
                width={64}
                height={64}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-lg bg-primary/10 text-primary text-2xl font-bold">
                {dataset.organisation.name.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{dataset.title}</h1>
                  <Link
                    href={`/organisations/${dataset.organisation.slug}`}
                    className="mt-2 inline-block text-sm text-muted-foreground hover:text-primary"
                  >
                    {dataset.organisation.name}
                  </Link>
                </div>
                <VisibilityBadge visibility={dataset.visibility} />
              </div>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={dataset.status} />
                {dataset.groups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.slug}`}>
                    <Badge variant="secondary" className="hover:bg-secondary/80">
                      {group.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {dataset.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            {/* Data Preview — hidden for formats the Spatial Preview card
                already renders fully (table + map) on its own */}
            {backendDataset?.file_path &&
              !SPATIAL_ONLY_PREVIEW_FORMATS.includes(backendDataset.format) && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {isPreviewLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                      <span className="ml-3 text-sm text-muted-foreground">Loading preview...</span>
                    </div>
                  ) : previewBlocked ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lock className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {isAuthenticated ? "Preview requires access" : "Log in to preview"}
                      </p>
                      <p className="text-xs mt-1">
                        {isAuthenticated
                          ? "This dataset is restricted — request access below to preview it."
                          : "This dataset is restricted — log in and request access to preview it."}
                      </p>
                    </div>
                  ) : previewData ? (
                    <div className="space-y-4">
                      {/* Tabular Preview (CSV/Excel) */}
                      {(previewData.preview as { type?: string; columns?: string[] })?.type === 'tabular' && (previewData.preview as { columns?: string[] }).columns ? (
                        <>
                          <div className="rounded-lg border overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  {((previewData.preview as { columns?: string[] }).columns || []).map((col: string, idx: number) => (
                                    <th key={idx} className="px-4 py-2 text-left font-medium">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {((previewData.preview as { rows?: Record<string, unknown>[] }).rows || []).slice(0, 10).map((row: Record<string, unknown>, rowIdx: number) => (
                                  <tr key={rowIdx} className="hover:bg-muted/30">
                                    {((previewData.preview as { columns?: string[] }).columns || []).map((col: string, cellIdx: number) => (
                                      <td key={cellIdx} className="px-4 py-2">
                                        {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {(previewData.preview as { totalRows?: number | string }).totalRows && (
                            <p className="text-xs text-muted-foreground text-center">
                              Showing first 10 of {typeof (previewData.preview as { totalRows?: number | string }).totalRows === 'number' 
                                ? (previewData.preview as { totalRows: number }).totalRows.toLocaleString() 
                                : (previewData.preview as { totalRows: string }).totalRows} rows
                              {(previewData.preview as { isPartialPreview?: boolean }).isPartialPreview && ' (preview only)'}
                            </p>
                          )}
                        </>
                      ) : null}

                      {/* JSON Preview */}
                      {(previewData.preview as { type?: string })?.type === 'json' && (
                        <div className="space-y-3">
                          {(previewData.preview as { message?: string }).message ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="size-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">{(previewData.preview as { message: string }).message}</p>
                              {(previewData.preview as { fileSizeMB?: number }).fileSizeMB && (
                                <p className="text-xs mt-1">File size: {(previewData.preview as { fileSizeMB: number }).fileSizeMB} MB</p>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="rounded-lg border p-4 bg-muted/30">
                                <pre className="text-xs overflow-x-auto max-h-96">
                                  {JSON.stringify((previewData.preview as { records?: unknown[]; data?: unknown }).records?.slice(0, 5) || (previewData.preview as { data?: unknown }).data, null, 2)}
                                </pre>
                              </div>
                              {(previewData.preview as { totalRecords?: number }).totalRecords && (
                                <p className="text-xs text-muted-foreground text-center">
                                  Showing first 5 of {(previewData.preview as { totalRecords: number }).totalRecords.toLocaleString()} records
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* GeoJSON Preview */}
                      {(previewData.preview as { type?: string })?.type === 'geojson' && (
                        <div className="space-y-3">
                          <div className="rounded-lg border p-4 bg-muted/30">
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Format:</span> GeoJSON</p>
                              <p><span className="font-medium">Features:</span> {(previewData.preview as { totalFeatures?: number }).totalFeatures?.toLocaleString()}</p>
                              {(previewData.preview as { bbox?: unknown }).bbox ? (
                                <p><span className="font-medium">Bounding Box:</span> {JSON.stringify((previewData.preview as { bbox: unknown }).bbox)}</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            View on map below for spatial visualization
                          </p>
                        </div>
                      )}

                      {/* Document Preview (PDF) */}
                      {(previewData.preview as { type?: string })?.type === 'document' && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="size-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">{(previewData.preview as { message?: string }).message}</p>
                        </div>
                      )}

                      {/* Error or Unknown Format */}
                      {((previewData.preview as { type?: string })?.type === 'error' || (previewData.preview as { type?: string })?.type === 'unknown') && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="size-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">{(previewData.preview as { message?: string }).message}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="size-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Preview not available</p>
                      <p className="text-xs mt-1">The file may not be uploaded yet or format is not supported</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resources / Files */}
            {dataset.resources && dataset.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Files & Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {dataset.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{resource.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {resource.format} • {formatBytes(resource.sizeBytes)} •
                              Updated{" "}
                              {formatDistanceToNow(new Date(resource.updatedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <DatasetDownloadActions
                          datasetId={dataset.id}
                          datasetSlug={dataset.slug}
                          datasetTitle={dataset.title}
                          visibility={dataset.visibility}
                          datasetOrganisationId={dataset.organisation.id}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Spatial preview for geo datasets */}
            <DatasetMapSection
              preview={previewData?.preview}
              lgaCoverage={dataset.lgaCoverage}
            />

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      File Formats
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dataset.formats.map((format) => (
                        <Badge key={format} variant="outline">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      LGA Coverage
                    </p>
                    <p className="mt-1 text-sm">
                      {dataset.lgaCoverage.includes("All")
                        ? "All 25 LGAs"
                        : `${dataset.lgaCoverage.length} LGAs`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download</CardTitle>
              </CardHeader>
              <CardContent>
                <DatasetDownloadActions
                  datasetId={dataset.id}
                  datasetSlug={dataset.slug}
                  datasetTitle={dataset.title}
                  visibility={dataset.visibility}
                  datasetOrganisationId={dataset.organisation.id}
                />
              </CardContent>
            </Card>

            <DatasetActivityPanel />

            {/* Related Datasets */}
            {relatedDatasets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Datasets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedDatasets.map((related) => (
                    <Link
                      key={related.id}
                      href={`/dataportal/${related.slug}`}
                      className="block group"
                    >
                      <p className="text-sm font-medium group-hover:text-primary line-clamp-2">
                        {related.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {related.organisation.name}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
