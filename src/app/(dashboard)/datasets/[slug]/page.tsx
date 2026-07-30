"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FileText, ChevronRight, Edit, Trash2, Send, ArrowLeft, Eye, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Container } from "@/components/layout/container";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetDownloadActions } from "@/components/data/dataset-download-actions";
import { DatasetMapSection } from "@/components/data/dataset-map-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOrganizationDataset, useDeleteDataset, useSubmitDatasetForReview, useDatasetPreview, useDatasetFiles, useDownloadDataset } from "@/lib/hooks/useDatasets";
import { useCategories } from "@/lib/hooks/useCategories";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useAuth } from "@/lib/auth";
import { transformDataset } from "@/lib/adapters/dataset-adapter";
import { DatasetCardSkeleton } from "@/components/feedback/skeletons";
import { formatDate } from "@/lib/utils/date";
import { SPATIAL_ONLY_PREVIEW_FORMATS } from "@/lib/constants/core";
import type { DatasetFile } from "@/lib/api/datasets";
import type { PaginatedResponse } from "@/lib/types/common";
import type { Category } from "@/lib/api/categories";
import type { Organisation } from "@/lib/api/organisations";
import { toast } from "sonner";
import { useState } from "react";

interface DatasetPageProps {
  params: Promise<{ slug: string }>;
}

export default function MyDatasetDetailPage({ params }: DatasetPageProps) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch dataset using organization endpoint (shows all statuses)
  const { data: backendDataset, isLoading, error } = useOrganizationDataset(slug);
  
  // Organization members can preview their datasets regardless of status
  const { data: previewData, isLoading: isPreviewLoading } = useDatasetPreview(
    slug,
    !!backendDataset?.file_path // Only need file to be uploaded
  );
  
  const deleteDatasetMutation = useDeleteDataset();
  const submitDatasetMutation = useSubmitDatasetForReview();
  const { data: files } = useDatasetFiles(slug);
  const downloadMutation = useDownloadDataset();
  
  // Fetch reference data for transformation
  const { data: categoriesResponse } = useCategories() as { data?: PaginatedResponse<Category> };
  const { data: organisationsResponse } = useOrganisations(1, 100) as { data?: PaginatedResponse<Organisation> };
  
  // Transform backend dataset to frontend format
  const dataset = backendDataset
    ? transformDataset(backendDataset, categoriesResponse?.data ?? [], organisationsResponse?.data ?? [])
    : null;

  // Permission helpers
  const canEdit = () => {
    if (!user || !dataset) return false;
    
    // Admin can edit all org datasets
    if (user.role === "admin") return true;
    
    // Approved datasets cannot be edited by contributors
    if (dataset.status === "approved") return false;
    
    // Contributor can only edit their own non-approved datasets
    if (user.role === "contributor" && backendDataset?.owner_id === user.id) return true;
    
    return false;
  };

  const canDelete = () => {
    if (!user || !dataset) return false;
    
    const deletableStatuses = ["draft", "rejected", "pending", "approved"];
    
    // Admin can delete any status
    if (user.role === "admin" && deletableStatuses.includes(dataset.status)) {
      return true;
    }
    
    // Contributor can only delete their own draft or rejected
    if (user.role === "contributor" && backendDataset?.owner_id === user.id) {
      return dataset.status === "draft" || dataset.status === "rejected";
    }
    
    return false;
  };

  const canSubmit = () => {
    if (!dataset) return false;
    
    // Only draft or rejected can be submitted
    if (dataset.status !== "draft" && dataset.status !== "rejected") {
      return false;
    }
    
    // Admin can submit any org dataset
    if (user?.role === "admin") {
      return true;
    }
    
    // Contributor can only submit their own
    if (user?.role === "contributor" && backendDataset?.owner_id === user.id) {
      return true;
    }
    
    return false;
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!dataset) return;
    
    deleteDatasetMutation.mutate(dataset.slug, {
      onSuccess: () => {
        toast.success("Dataset archived successfully");
        router.push("/datasets");
      },
      onError: () => {
        toast.error("Failed to archive dataset");
      },
    });
  };

  const handleSubmit = () => {
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = () => {
    if (!dataset) return;
    
    submitDatasetMutation.mutate(dataset.slug, {
      onSuccess: () => {
        toast.success("Dataset submitted for review successfully");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to submit dataset for review");
      },
    });
  };

  const handleFileView = (file: DatasetFile) => {
    downloadMutation.mutate(
      { slug, mode: "view", fileId: file.id },
      {
        onSuccess: (data) => window.open(data.downloadUrl, "_blank", "noopener,noreferrer"),
        onError: (error: Error) => toast.error(error.message || "Failed to open file"),
      }
    );
  };

  const handleFileDownload = (file: DatasetFile) => {
    downloadMutation.mutate(
      { slug, mode: "download", fileId: file.id },
      {
        onSuccess: (data) => {
          window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
          toast.success(`Downloading ${data.fileName}`);
        },
        onError: (error: Error) => toast.error(error.message || "Failed to generate download link"),
      }
    );
  };

  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

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

  return (
    <main className="flex-1 bg-muted/40">
      {/* Breadcrumb */}
      <div className="border-b bg-background">
        <Container size="wide" className="py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <ChevronRight className="size-4" />
            <Link href="/datasets" className="hover:text-foreground">
              Datasets
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">{dataset.title}</span>
          </nav>
        </Container>
      </div>

      {/* Header with Actions */}
      <div className="border-b bg-background">
        <Container size="wide" className="py-6">
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    {dataset.organisation.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VisibilityBadge visibility={dataset.visibility} />
                  <StatusBadge status={dataset.status} publishedAt={backendDataset?.published_at} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <Link href="/datasets">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="size-4 mr-2" />
                    Back to List
                  </Button>
                </Link>
                
                {canSubmit() && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSubmit}
                    disabled={submitDatasetMutation.isPending}
                  >
                    <Send className="size-4 mr-2" />
                    Submit for Review
                  </Button>
                )}
                
                {canEdit() && (
                  <Link href={`/edit/${dataset.slug}`}>
                    <Button size="sm" variant="outline">
                      <Edit className="size-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                )}
                
                {canDelete() && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={deleteDatasetMutation.isPending}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>

              {/* Tags */}
              {dataset.groups.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {dataset.groups.map((group) => (
                    <Badge key={group.id} variant="secondary">
                      {group.name}
                    </Badge>
                  ))}
                </div>
              )}
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

            {/* Files — a dataset can have more than one file uploaded to it */}
            {files && files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Data Files
                    {files.length > 1 && (
                      <Badge variant="secondary" className="ml-1">{files.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.format.toUpperCase()} • {formatBytes(file.file_size ?? 0)} • Uploaded{" "}
                              {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleFileView(file)} disabled={downloadMutation.isPending}>
                            <Eye className="size-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleFileDownload(file)} disabled={downloadMutation.isPending}>
                            <Download className="size-4" />
                          </Button>
                        </div>
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
                      Category
                    </p>
                    <p className="mt-1 text-sm">
                      {categoriesResponse?.data?.find((c) => c.id === backendDataset?.category_id)?.name ?? "—"}
                    </p>
                  </div>
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
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Reporting Period
                    </p>
                    <p className="mt-1 text-sm">
                      {backendDataset?.temporal_coverage_start && backendDataset?.temporal_coverage_end
                        ? `${formatDate(backendDataset.temporal_coverage_start)} – ${formatDate(backendDataset.temporal_coverage_end)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Data License
                    </p>
                    <p className="mt-1 text-sm">{backendDataset?.license || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Update Frequency
                    </p>
                    <p className="mt-1 text-sm">{backendDataset?.update_frequency || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Downloads
                    </p>
                    <p className="mt-1 text-sm">
                      {dataset.downloadCount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDate(dataset.updatedAt)}
                    </p>
                  </div>
                </div>

                {backendDataset?.disease_indicators && backendDataset.disease_indicators.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Disease / Health Indicators
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {backendDataset.disease_indicators.map((indicator) => (
                        <Badge key={indicator} variant="secondary">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(backendDataset?.responsible_dept || backendDataset?.contact_person || backendDataset?.contact_email) && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Contact
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    <p className="text-sm font-medium text-muted-foreground">Methodology</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {backendDataset.methodology}
                    </p>
                  </div>
                )}

                {backendDataset?.limitations && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Known Limitations</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {backendDataset.limitations}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <DatasetDownloadActions
                  datasetId={dataset.id}
                  datasetSlug={dataset.slug}
                  datasetTitle={dataset.title}
                  visibility={dataset.visibility}
                  datasetOrganisationId={dataset.organisation.id}
                />
              </CardContent>
            </Card>

            {/* Owner Info */}
            {backendDataset && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dataset Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(backendDataset.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">
                      {dataset.status === "approved" && backendDataset.published_at
                        ? "Published"
                        : dataset.status}
                    </p>
                  </div>
                  {dataset.status === "approved" && (
                    <div>
                      <p className="text-muted-foreground">Published</p>
                      <p className="font-medium">
                        {backendDataset.published_at
                          ? formatDate(backendDataset.published_at)
                          : "Not yet published"}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Visibility</p>
                    <p className="font-medium capitalize">{dataset.visibility}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>

      {/* Submit Dialog */}
      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit for Review"
        description={`Submit "${dataset.title}" for review? It will be sent to administrators for approval.`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={confirmSubmit}
        variant="default"
        isLoading={submitDatasetMutation.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Dataset"
        description={`Are you sure you want to archive "${dataset.title}"? This action can be reversed by administrators.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDatasetMutation.isPending}
      />
    </main>
  );
}
