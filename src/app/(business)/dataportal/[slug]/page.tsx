"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckSquare,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Lock,
  Square,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Container } from "@/components/layout/container";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetDownloadActions } from "@/components/data/dataset-download-actions";
import { DatasetMapSection } from "@/components/data/dataset-map-section";
import { DatasetActivityPanel } from "@/components/data/dataset-activity-panel";
import { DatasetInsightsPanel } from "@/components/data/dataset-insights-panel";
import { MultipleFilePreviews } from "@/components/data/multiple-file-previews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDataset,
  useDatasetFiles,
  useDatasetInsights,
  useDatasetPreview,
  useDatasets,
} from "@/lib/hooks/useDatasets";
import { usePublicDatasetPreview } from "@/lib/hooks/usePublicDatasetPreview";
import { usePublicDatasetInsights } from "@/lib/hooks/usePublicDatasetInsights";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDevelopmentPartners } from "@/lib/hooks/useDevelopmentPartners";
import { transformDataset } from "@/lib/adapters/dataset-adapter";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { SPATIAL_ONLY_PREVIEW_FORMATS } from "@/lib/constants/core";
import { formatDate } from "@/lib/utils/date";
import type { PaginatedResponse } from "@/lib/types/common";
import type { Category } from "@/lib/api/categories";
import type { DevelopmentPartner } from "@/lib/api/development-partners";
import { bulkDownloadFiles } from "@/lib/api/datasets";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DatasetPageProps {
  params: Promise<{ slug: string }>;
}

export default function DatasetPage({ params }: DatasetPageProps) {
  const { slug } = use(params);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  
  // Fetch dataset by slug (public endpoint — now also returns restricted
  // datasets as metadata-only, so this can 200 even without access)
  const { data: backendDataset, isLoading, error } = useDataset(slug);
  const { data: files } = useDatasetFiles(slug);
  const { isAuthenticated } = useAuth();
  const isVisibleInDataPortal =
    backendDataset?.status === "approved" &&
    !!backendDataset.published_at &&
    backendDataset.visibility !== "private";

  // Public preview/insights require an approved, published, public dataset.
  // Published restricted datasets use authenticated endpoints for members
  // with access; unpublished datasets are excluded from this page entirely.
  const canUsePublicDataEndpoints =
    backendDataset?.status === "approved" &&
    !!backendDataset.published_at &&
    backendDataset.visibility === "public";
  const { data: publicPreviewData } = usePublicDatasetPreview(
    slug,
    isVisibleInDataPortal && canUsePublicDataEndpoints
  );
  const {
    data: authPreviewData,
    error: authPreviewError,
  } = useDatasetPreview(
    slug,
    isVisibleInDataPortal && !canUsePublicDataEndpoints && isAuthenticated,
  );

  const previewData = canUsePublicDataEndpoints ? publicPreviewData : authPreviewData;
  // 403 from the authenticated endpoint means "no access yet", not "broken
  // file" — the generic fallback message would be misleading here.
  const previewBlocked =
    !canUsePublicDataEndpoints && (!isAuthenticated || !!authPreviewError);

  // Same public/authenticated split as the preview above, since insights
  // are derived from the same file and carry the same access sensitivity.
  const { data: publicInsightsData, isLoading: isPublicInsightsLoading } = usePublicDatasetInsights(
    slug,
    isVisibleInDataPortal && canUsePublicDataEndpoints
  );
  const { data: authInsightsData, isLoading: isAuthInsightsLoading } = useDatasetInsights(
    slug,
    isVisibleInDataPortal && !canUsePublicDataEndpoints && isAuthenticated
  );
  const insightsData = canUsePublicDataEndpoints ? publicInsightsData : authInsightsData;
  const isInsightsLoading = canUsePublicDataEndpoints
    ? isPublicInsightsLoading
    : isAuthenticated && isAuthInsightsLoading;
  
  // Fetch reference data for transformation
  const { data: categoriesResponse } = useCategories() as { data?: PaginatedResponse<Category> };
  const { data: organisationsResponse } = useDevelopmentPartners(1, 100) as { data?: PaginatedResponse<DevelopmentPartner> };
  
  // Transform backend dataset to frontend format
  const dataset = backendDataset
    ? transformDataset(backendDataset, categoriesResponse?.data ?? [], organisationsResponse?.data ?? [])
    : null;
  
  // Fetch related datasets (same category)
  const { data: relatedData } = useDatasets(
    isVisibleInDataPortal && dataset?.healthCategory && backendDataset?.category_id
      ? {
          categoryId: backendDataset.category_id,
          catalogue: true,
          limit: 4,
          status: 'approved',
          published: true,
        }
      : undefined,
    { enabled: isVisibleInDataPortal },
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
        {/* Breadcrumb skeleton */}
        <div className="border-b bg-muted/40">
          <Container size="wide" className="py-4">
            <Skeleton className="h-5 w-64" />
          </Container>
        </div>

        {/* Header skeleton */}
        <div className="border-b bg-background">
          <Container size="wide" className="py-8">
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container size="wide" className="py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[500px] w-full" />
                </CardContent>
              </Card>

              {/* Files */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Download */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>

              {/* Related Datasets */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>

              {/* Activity */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (error || !dataset || !isVisibleInDataPortal) {
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

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((selected) =>
      selected.includes(fileId)
        ? selected.filter((id) => id !== fileId)
        : [...selected, fileId],
    );
  };

  const handleSelectAll = () => {
    setSelectedFileIds((selected) =>
      selected.length === files?.length ? [] : (files?.map((file) => file.id) ?? []),
    );
  };

  const downloadFilesAsZip = async (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    setIsBulkDownloading(true);
    try {
      const result = await bulkDownloadFiles(slug, fileIds);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileIds.length} file(s) as ZIP`);
      setSelectedFileIds([]);
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Failed to download files");
    } finally {
      setIsBulkDownloading(false);
    }
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
            {/* Development Partner Logo */}
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
                    href={`/development-partners/${dataset.organisation.slug}`}
                    className="mt-2 inline-block text-sm text-muted-foreground hover:text-primary"
                  >
                    {dataset.organisation.name}
                  </Link>
                </div>
                <VisibilityBadge visibility={dataset.visibility} />
              </div>

              {/* Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {dataset.status !== "approved" && <StatusBadge status={dataset.status} />}
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

            {files?.length ? (
              <MultipleFilePreviews slug={slug} files={files} />
            ) : backendDataset?.file_path && previewBlocked ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Lock className="mx-auto mb-3 size-12 opacity-50" />
                  <p className="text-sm">
                    {isAuthenticated ? "Preview requires access" : "Log in to preview"}
                  </p>
                  <p className="mt-1 text-xs">
                    {isAuthenticated
                      ? "This dataset is restricted — request access below to preview it."
                      : "This dataset is restricted — log in and request access to preview it."}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {/* Automated Insights — deterministic column profiling (date +
                numeric metric detection, trend), not shown at all when the
                file has no detectable date/metric columns or is blocked by
                the same restricted/private access gate as the preview. */}
            {backendDataset?.file_path &&
              !SPATIAL_ONLY_PREVIEW_FORMATS.includes(backendDataset.format) &&
              !previewBlocked && (
                <DatasetInsightsPanel
                  insights={insightsData}
                  isLoading={isInsightsLoading}
                />
              )}

            {/* Resources / Files */}
            {files?.length ? (
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CardTitle>Data Files & Resources</CardTitle>
                    {files.length > 1 ? <Badge variant="secondary">{files.length} files</Badge> : null}
                  </div>
                  {selectedFileIds.length > 0 ? (
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => void downloadFilesAsZip(selectedFileIds)}
                      disabled={isBulkDownloading}
                    >
                      {isBulkDownloading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      Download {selectedFileIds.length} selected
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {files.length > 1 ? (
                    <div className="mb-2 flex items-center gap-2 border-b pb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-8 text-xs"
                      >
                        {selectedFileIds.length === files.length ? (
                          <CheckSquare className="mr-1 size-4" />
                        ) : (
                          <Square className="mr-1 size-4" />
                        )}
                        {selectedFileIds.length === files.length ? "Deselect all" : "Select all"}
                      </Button>
                      {selectedFileIds.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {selectedFileIds.length} selected
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <ul className="divide-y">
                    {files.map((file) => {
                      const isSelected = selectedFileIds.includes(file.id);
                      return (
                        <li
                          key={file.id}
                          className={cn(
                            "flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0",
                            isSelected && "bg-muted/30",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {files.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => toggleFileSelection(file.id)}
                                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={isSelected ? "Deselect file" : "Select file"}
                              >
                                {isSelected ? (
                                  <CheckSquare className="size-5" />
                                ) : (
                                  <Square className="size-5" />
                                )}
                              </button>
                            ) : null}
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {file.format.toUpperCase()} • {formatBytes(file.file_size ?? 0)} • Updated{" "}
                                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : dataset.resources && dataset.resources.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Data Files & Resources</CardTitle>
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
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download</CardTitle>
              </CardHeader>
              <CardContent>
                {files?.length ? (
                  <Button
                    className="w-full gap-2"
                    onClick={() => void downloadFilesAsZip(files.map((file) => file.id))}
                    disabled={isBulkDownloading}
                  >
                    {isBulkDownloading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    Download all files as ZIP
                  </Button>
                ) : (
                  <DatasetDownloadActions
                    datasetId={dataset.id}
                    datasetSlug={dataset.slug}
                    datasetTitle={dataset.title}
                    visibility={dataset.visibility}
                    datasetOrganisationId={dataset.organisation.id}
                  />
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Category
                    </p>
                    <p className="mt-1 text-sm">
                      {categoriesResponse?.data?.find((c) => c.id === backendDataset?.category_id)?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      File Formats
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {files && files.length > 0 ? (
                        // Show unique formats from all uploaded files
                        Array.from(new Set(files.map((f) => f.format.toUpperCase()))).map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))
                      ) : (
                        // Fallback to dataset primary format
                        dataset.formats.map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      LGA Coverage
                    </p>
                    <p className="mt-1 text-sm">
                      {dataset.lgaCoverage.includes("All")
                        ? "All 25 LGAs"
                        : `${dataset.lgaCoverage.length} LGAs`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Reporting Period
                    </p>
                    <p className="mt-1 text-sm">
                      {backendDataset?.temporal_coverage_start && backendDataset?.temporal_coverage_end
                        ? `${formatDate(backendDataset.temporal_coverage_start)} – ${formatDate(backendDataset.temporal_coverage_end)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Data License
                    </p>
                    <p className="mt-1 text-sm">{backendDataset?.license || "—"}</p>
                  </div>
                </div>

                {backendDataset?.disease_indicators && backendDataset.disease_indicators.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">
                      Disease / Health Indicators
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {backendDataset.disease_indicators.map((indicator) => (
                        <Badge key={indicator} variant="secondary" className="text-xs">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(backendDataset?.responsible_dept || backendDataset?.contact_person || backendDataset?.contact_email) && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Contact
                    </p>
                    <div className="space-y-2">
                      {backendDataset?.responsible_dept && (
                        <div>
                          <p className="text-xs text-muted-foreground">Responsible Department</p>
                          <p className="text-sm">{backendDataset.responsible_dept}</p>
                        </div>
                      )}
                      {(backendDataset?.contact_person || backendDataset?.contact_email) && (
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <p className="text-sm">
                            {backendDataset.contact_person}
                            {backendDataset.contact_person && backendDataset.contact_email && " · "}
                            {backendDataset.contact_email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {backendDataset?.methodology && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Methodology</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {backendDataset.methodology}
                    </p>
                  </div>
                )}

                {backendDataset?.limitations && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Known Limitations</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {backendDataset.limitations}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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

            <DatasetActivityPanel
              views={backendDataset.view_count}
              downloads={backendDataset.download_count}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
