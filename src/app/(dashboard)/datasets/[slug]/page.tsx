"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  ChevronRight,
  Edit,
  Trash2,
  Send,
  ArrowLeft,
  Eye,
  Download,
  Database,
  MoreHorizontal,
  Info,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetDownloadActions } from "@/components/data/dataset-download-actions";
import { DatasetMapSection } from "@/components/data/dataset-map-section";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HelpTip } from "@/components/ui/help-tip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import {
  useOrganizationDataset,
  useDeleteDataset,
  useSubmitDatasetForReview,
  useDatasetPreview,
  useDatasetFiles,
  useDownloadDataset,
} from "@/lib/hooks/useDatasets";
import { useCategories } from "@/lib/hooks/useCategories";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { canEditDataset, canDeleteDataset, canSubmitDataset } from "@/lib/auth";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import { transformDataset } from "@/lib/adapters/dataset-adapter";
import { formatDate } from "@/lib/utils/date";
import { SPATIAL_ONLY_PREVIEW_FORMATS } from "@/lib/constants/core";
import {
  PORTAL_DATASET_DETAIL_PAGE_TIP,
  PORTAL_DATASET_FILES_TIP,
  PORTAL_DATASET_INFO_TIP,
  PORTAL_DATASET_METADATA_TIP,
  PORTAL_DATASET_PREVIEW_TIP,
  PORTAL_DATASET_SUBMIT_TIP,
} from "@/lib/constants/portal-tooltips";
import type { DatasetFile, Dataset as BackendDataset } from "@/lib/api/datasets";
import type { PaginatedResponse } from "@/lib/types/common";
import type { Category } from "@/lib/api/categories";
import type { Organisation } from "@/lib/api/organisations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DatasetPageProps {
  params: Promise<{ slug: string }>;
}

export default function MyDatasetDetailPage({ params }: DatasetPageProps) {
  const { slug } = use(params);
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();
  const router = useRouter();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: backendDataset, isLoading, error } = useOrganizationDataset(slug);

  const { data: previewData, isLoading: isPreviewLoading } = useDatasetPreview(
    slug,
    !!backendDataset?.file_path,
  );

  const deleteDatasetMutation = useDeleteDataset();
  const submitDatasetMutation = useSubmitDatasetForReview();
  const { data: files } = useDatasetFiles(slug);
  const downloadMutation = useDownloadDataset();

  const { data: categoriesResponse } = useCategories() as { data?: PaginatedResponse<Category> };
  const { data: organisationsResponse } = useOrganisations(1, 100) as {
    data?: PaginatedResponse<Organisation>;
  };

  const dataset = backendDataset
    ? transformDataset(backendDataset, categoriesResponse?.data ?? [], organisationsResponse?.data ?? [])
    : null;

  const datasetFields = backendDataset
    ? { status: backendDataset.status, owner_id: backendDataset.owner_id }
    : null;
  const canEdit = () => canEditDataset(user, datasetFields);
  const canDelete = () => canDeleteDataset(user, datasetFields);
  const canSubmit = () => canSubmitDataset(user, datasetFields);

  if (authLoading || !allowed) {
    return null;
  }

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
      },
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
      },
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <div className="flex gap-4">
            <Skeleton className="size-14 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-full max-w-sm" />
            </div>
          </div>
        </div>
        <DashboardPageContent className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (error || !dataset) {
    notFound();
  }

  const hasActions = canSubmit() || canEdit() || canDelete();
  const showDataPreview =
    backendDataset?.file_path &&
    !SPATIAL_ONLY_PREVIEW_FORMATS.includes(backendDataset.format);

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href="/datasets" className="hover:text-foreground">
            Datasets
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <span className="truncate text-foreground">{dataset.title}</span>
        </nav>
      </div>

      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {dataset.organisation.logoUrl ? (
              <Image
                src={dataset.organisation.logoUrl}
                alt=""
                width={56}
                height={56}
                className="size-12 shrink-0 rounded-xl object-cover sm:size-14"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-lg font-bold text-primary sm:size-14 sm:text-xl">
                {dataset.organisation.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <VisibilityBadge visibility={dataset.visibility} />
                <StatusBadge status={dataset.status} publishedAt={backendDataset?.published_at} />
              </div>
              <h1 className="mt-2 flex items-start gap-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                <span className="min-w-0">{dataset.title}</span>
                <HelpTip
                  content={PORTAL_DATASET_DETAIL_PAGE_TIP}
                  label="Dataset detail help"
                  className="mt-0.5"
                />
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{dataset.organisation.name}</p>
            </div>
          </div>

          {dataset.groups.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dataset.groups.map((group) => (
                <Badge key={group.id} variant="secondary">
                  {group.name}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/datasets"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 gap-2 sm:h-9")}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>

            {canSubmit() ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  className="h-10 gap-2 bg-success hover:bg-success/90 sm:h-9"
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={submitDatasetMutation.isPending}
                >
                  <Send className="size-4" />
                  Submit for review
                </Button>
                <HelpTip content={PORTAL_DATASET_SUBMIT_TIP} label="Submit for review help" />
              </div>
            ) : null}

            {hasActions ? (
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "size-10 px-0",
                    )}
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">More actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {canEdit() ? (
                      <DropdownMenuItem onClick={() => router.push(`/edit/${dataset.slug}`)}>
                        <Edit className="size-4" />
                        Edit dataset
                      </DropdownMenuItem>
                    ) : null}
                    {canDelete() ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          <Trash2 className="size-4" />
                          Archive
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}

            {canEdit() ? (
              <Link
                href={`/edit/${dataset.slug}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "hidden h-9 gap-2 sm:inline-flex",
                )}
              >
                <Edit className="size-4" />
                Edit
              </Link>
            ) : null}

            {canDelete() ? (
              <Button
                size="sm"
                variant="outline"
                className="hidden h-9 gap-2 text-destructive hover:text-destructive sm:inline-flex"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteDatasetMutation.isPending}
              >
                <Trash2 className="size-4" />
                Archive
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            <DashboardPanel title="Description" icon={FileText} tone="muted">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {dataset.description || "No description available."}
              </p>
            </DashboardPanel>

            {showDataPreview ? (
              <DashboardPanel
                title="Data preview"
                titleTip={PORTAL_DATASET_PREVIEW_TIP}
                icon={Database}
                tone="info"
              >
                <DataPreviewContent
                  isLoading={isPreviewLoading}
                  previewData={previewData}
                />
              </DashboardPanel>
            ) : null}

            {files && files.length > 0 ? (
              <DashboardPanel
                title="Data files"
                titleTip={PORTAL_DATASET_FILES_TIP}
                icon={FileText}
                tone="primary"
                action={
                  files.length > 1 ? (
                    <Badge variant="secondary">{files.length} files</Badge>
                  ) : undefined
                }
              >
                <ul className="divide-y">
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.format.toUpperCase()} · {formatBytes(file.file_size ?? 0)} ·{" "}
                            {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-10 sm:size-9"
                          onClick={() => handleFileView(file)}
                          disabled={downloadMutation.isPending}
                          aria-label="View file"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-10 sm:size-9"
                          onClick={() => handleFileDownload(file)}
                          disabled={downloadMutation.isPending}
                          aria-label="Download file"
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            ) : null}

            <DatasetMapSection preview={previewData?.preview} lgaCoverage={dataset.lgaCoverage} />

            <DashboardPanel
              title="Additional information"
              titleTip={PORTAL_DATASET_METADATA_TIP}
              icon={Info}
              tone="success"
            >
              <MetadataGrid
                dataset={dataset}
                backendDataset={backendDataset!}
                categories={categoriesResponse?.data ?? []}
              />
            </DashboardPanel>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <DashboardPanel title="Quick actions" tone="primary">
              <DatasetDownloadActions
                datasetId={dataset.id}
                datasetSlug={dataset.slug}
                datasetTitle={dataset.title}
                visibility={dataset.visibility}
                datasetOrganisationId={dataset.organisation.id}
              />
            </DashboardPanel>

            {backendDataset ? (
              <DashboardPanel
                title="Dataset info"
                titleTip={PORTAL_DATASET_INFO_TIP}
                icon={MapPin}
                tone="muted"
              >
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium tabular-nums">
                      {formatDistanceToNow(new Date(backendDataset.created_at), {
                        addSuffix: true,
                      })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">
                      {dataset.status === "approved" && backendDataset.published_at
                        ? "Published"
                        : dataset.status.replace("_", " ")}
                    </dd>
                  </div>
                  {dataset.status === "approved" ? (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Published</dt>
                      <dd className="font-medium tabular-nums">
                        {backendDataset.published_at
                          ? formatDate(backendDataset.published_at)
                          : "Not yet published"}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Visibility</dt>
                    <dd className="font-medium capitalize">{dataset.visibility}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Downloads</dt>
                    <dd className="font-medium tabular-nums">
                      {dataset.downloadCount?.toLocaleString() ?? 0}
                    </dd>
                  </div>
                </dl>
              </DashboardPanel>
            ) : null}
          </div>
        </div>
      </DashboardPageContent>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit for review"
        description={`Submit "${dataset.title}" for review? It will be sent to administrators for approval.`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        onConfirm={confirmSubmit}
        variant="default"
        isLoading={submitDatasetMutation.isPending}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive dataset"
        description={`Are you sure you want to archive "${dataset.title}"? This action can be reversed by administrators.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDatasetMutation.isPending}
      />
    </DashboardPage>
  );
}

function DataPreviewContent({
  isLoading,
  previewData,
}: {
  isLoading: boolean;
  previewData: { preview?: unknown } | undefined;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading preview…</span>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <FileText className="mx-auto mb-3 size-10 opacity-50" />
        <p className="text-sm">Preview not available</p>
        <p className="mt-1 text-xs">The file may not be uploaded yet or format is not supported</p>
      </div>
    );
  }

  const preview = previewData.preview as {
    type?: string;
    columns?: string[];
    rows?: Record<string, unknown>[];
    totalRows?: number | string;
    isPartialPreview?: boolean;
    message?: string;
    fileSizeMB?: number;
    records?: unknown[];
    data?: unknown;
    totalRecords?: number;
    totalFeatures?: number;
    bbox?: unknown;
  };

  if (preview?.type === "tabular" && preview.columns) {
    return (
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                {preview.columns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium sm:px-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {(preview.rows || []).slice(0, 10).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/30">
                  {preview.columns!.map((col, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2 sm:px-4">
                      {row[col] !== null && row[col] !== undefined ? String(row[col]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {preview.totalRows ? (
          <p className="text-center text-xs text-muted-foreground">
            Showing first 10 of{" "}
            {typeof preview.totalRows === "number"
              ? preview.totalRows.toLocaleString()
              : preview.totalRows}{" "}
            rows
            {preview.isPartialPreview ? " (preview only)" : ""}
          </p>
        ) : null}
      </div>
    );
  }

  if (preview?.type === "json") {
    if (preview.message) {
      return (
        <div className="py-10 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 size-10 opacity-50" />
          <p className="text-sm">{preview.message}</p>
          {preview.fileSizeMB ? (
            <p className="mt-1 text-xs">File size: {preview.fileSizeMB} MB</p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-muted/30 p-4">
          <pre className="max-h-96 overflow-x-auto text-xs">
            {JSON.stringify(preview.records?.slice(0, 5) || preview.data, null, 2)}
          </pre>
        </div>
        {preview.totalRecords ? (
          <p className="text-center text-xs text-muted-foreground">
            Showing first 5 of {preview.totalRecords.toLocaleString()} records
          </p>
        ) : null}
      </div>
    );
  }

  if (preview?.type === "geojson") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border bg-muted/30 p-4 text-sm">
          <p>
            <span className="font-medium">Format:</span> GeoJSON
          </p>
          <p className="mt-1">
            <span className="font-medium">Features:</span>{" "}
            {preview.totalFeatures?.toLocaleString()}
          </p>
          {preview.bbox ? (
            <p className="mt-1">
              <span className="font-medium">Bounding box:</span> {JSON.stringify(preview.bbox)}
            </p>
          ) : null}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          View the spatial preview below for map visualization
        </p>
      </div>
    );
  }

  if (preview?.type === "document" || preview?.type === "error" || preview?.type === "unknown") {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <FileText className="mx-auto mb-3 size-10 opacity-50" />
        <p className="text-sm">{preview.message ?? "Preview not available for this format"}</p>
      </div>
    );
  }

  return (
    <div className="py-10 text-center text-muted-foreground">
      <FileText className="mx-auto mb-3 size-10 opacity-50" />
      <p className="text-sm">Preview not available</p>
    </div>
  );
}

function MetadataGrid({
  dataset,
  backendDataset,
  categories,
}: {
  dataset: ReturnType<typeof transformDataset>;
  backendDataset: BackendDataset;
  categories: Category[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Category
          </p>
          <p className="mt-1 text-sm">
            {categories.find((c) => c.id === backendDataset?.category_id)?.name ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            File formats
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            LGA coverage
          </p>
          <p className="mt-1 text-sm">
            {dataset.lgaCoverage.includes("All")
              ? "All 25 LGAs"
              : `${dataset.lgaCoverage.length} LGAs`}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reporting period
          </p>
          <p className="mt-1 text-sm">
            {backendDataset?.temporal_coverage_start && backendDataset?.temporal_coverage_end
              ? `${formatDate(backendDataset.temporal_coverage_start)} – ${formatDate(backendDataset.temporal_coverage_end)}`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Data licence
          </p>
          <p className="mt-1 text-sm">{backendDataset?.license || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Update frequency
          </p>
          <p className="mt-1 text-sm">{backendDataset?.update_frequency || "—"}</p>
        </div>
      </div>

      {backendDataset?.disease_indicators && backendDataset.disease_indicators.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Disease / health indicators
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {backendDataset.disease_indicators.map((indicator) => (
              <Badge key={indicator} variant="secondary">
                {indicator}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {(backendDataset?.responsible_dept ||
        backendDataset?.contact_person ||
        backendDataset?.contact_email) && (
        <div className="border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {backendDataset?.responsible_dept ? (
              <div>
                <p className="text-xs text-muted-foreground">Responsible department</p>
                <p className="text-sm">{backendDataset.responsible_dept}</p>
              </div>
            ) : null}
            {backendDataset?.contact_person || backendDataset?.contact_email ? (
              <div>
                <p className="text-xs text-muted-foreground">Contact person</p>
                <p className="text-sm">
                  {backendDataset.contact_person}
                  {backendDataset.contact_person && backendDataset.contact_email && " · "}
                  {backendDataset.contact_email}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {backendDataset?.methodology ? (
        <div className="border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Methodology
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {backendDataset.methodology}
          </p>
        </div>
      ) : null}

      {backendDataset?.limitations ? (
        <div className="border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Known limitations
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {backendDataset.limitations}
          </p>
        </div>
      ) : null}
    </div>
  );
}
