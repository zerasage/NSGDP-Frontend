"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Database,
  Upload,
  Edit,
  Trash2,
  Eye,
  Search,
  Send,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/data/status-badge";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useOrganizationDatasets,
  useDeleteDataset,
  useSubmitDatasetForReview,
} from "@/lib/hooks/useDatasets";
import { canEditDataset, canDeleteDataset, canSubmitDataset } from "@/lib/auth";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import {
  DashboardPanel,
  EmptyPanelState,
  FilterChip,
  MetricCard,
} from "@/components/dashboard/portal-dashboard-ui";
import { HelpTip } from "@/components/ui/help-tip";
import {
  PORTAL_DATASETS_PAGE_TIP,
  PORTAL_DATASETS_PENDING_METRIC_TIP,
  PORTAL_DATASETS_STATUS_TIP,
} from "@/lib/constants/portal-tooltips";
import type { DatasetStatus } from "@/types";
import type { DatasetVisibility } from "@/lib/api/datasets";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusFilters: { value: DatasetStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "In review" },
  { value: "draft", label: "Drafts" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export default function MyDatasetsPage() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | "all">(
    (searchParams?.get("status") as DatasetStatus) || "all",
  );
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<{ slug: string; title: string } | null>(
    null,
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOrganizationDatasets(
    {
      page: 1,
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
    },
    { enabled: !!user?.id },
  );

  const { data: countsData } = useOrganizationDatasets(
    { page: 1, limit: 100 },
    { enabled: !!user?.id },
  );

  const deleteDatasetMutation = useDeleteDataset();
  const submitDatasetMutation = useSubmitDatasetForReview();

  const datasets = data?.data ?? [];
  const meta = data?.meta;
  const allDatasetsForCounts = countsData?.data ?? [];

  if (authLoading || !allowed) {
    return null;
  }

  const canEditDatasetRow = (dataset: (typeof datasets)[0]) => canEditDataset(user, dataset);
  const canDeleteDatasetRow = (dataset: (typeof datasets)[0]) => canDeleteDataset(user, dataset);
  const canSubmitDatasetRow = (dataset: (typeof datasets)[0]) => canSubmitDataset(user, dataset);

  const statusCounts: Record<DatasetStatus | "all", number> = {
    all: allDatasetsForCounts.length,
    approved: allDatasetsForCounts.filter((d) => d.status === "approved").length,
    pending: allDatasetsForCounts.filter((d) => d.status === "pending").length,
    under_review: allDatasetsForCounts.filter((d) => d.status === "under_review").length,
    draft: allDatasetsForCounts.filter((d) => d.status === "draft").length,
    rejected: allDatasetsForCounts.filter((d) => d.status === "rejected").length,
    archived: allDatasetsForCounts.filter((d) => d.status === "archived").length,
  };

  const confirmDelete = () => {
    if (!selectedDataset) return;
    deleteDatasetMutation.mutate(selectedDataset.slug, {
      onSuccess: () => {
        toast.success("Dataset archived successfully");
        setSelectedDataset(null);
      },
      onError: () => toast.error("Failed to archive dataset"),
    });
  };

  const confirmSubmit = () => {
    if (!selectedDataset) return;
    submitDatasetMutation.mutate(selectedDataset.slug, {
      onSuccess: () => {
        toast.success("Dataset submitted for review");
        setSelectedDataset(null);
      },
      onError: (err: Error) =>
        toast.error(err?.message || "Failed to submit dataset for review"),
    });
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
              <Database className="size-3.5 text-success" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                Organisation
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Datasets
              <HelpTip content={PORTAL_DATASETS_PAGE_TIP} label="Datasets page help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage uploads, track review status, and keep catalogue entries up to date.
            </p>
          </div>
          <Link
            href="/upload"
            className={cn(buttonVariants(), "h-11 shrink-0 gap-2 sm:h-10")}
          >
            <Upload className="size-4" />
            Upload dataset
          </Link>
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total"
            value={statusCounts.all}
            hint="All organisation datasets"
            icon={Database}
            tone="success"
          />
          <MetricCard
            label="Pending"
            value={statusCounts.pending + statusCounts.under_review}
            hint="Awaiting review"
            icon={Send}
            tone="warning"
            tip={PORTAL_DATASETS_PENDING_METRIC_TIP}
            onClick={() => setStatusFilter("pending")}
          />
          <MetricCard
            label="Approved"
            value={statusCounts.approved}
            hint="Live in catalogue"
            icon={Eye}
            tone="info"
            onClick={() => setStatusFilter("approved")}
          />
          <MetricCard
            label="Drafts"
            value={statusCounts.draft}
            hint="Not yet submitted"
            icon={Edit}
            tone="muted"
            onClick={() => setStatusFilter("draft")}
          />
        </div>

        <DashboardPanel
          title="Your datasets"
          titleTip={PORTAL_DATASETS_STATUS_TIP}
          description="Filter by status or search by title and description."
          icon={Database}
          tone="success"
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RotateCcw className={cn("size-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {statusFilters.map((filter) => (
                <FilterChip
                  key={filter.value}
                  active={statusFilter === filter.value}
                  label={filter.label}
                  count={statusCounts[filter.value]}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search datasets…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl sm:h-20" />
                ))}
              </div>
            ) : error ? (
              <EmptyPanelState
                icon={Database}
                message="Failed to load datasets."
                action={
                  <Button variant="outline" className="h-11" onClick={() => void refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : datasets.length === 0 ? (
              <EmptyPanelState
                icon={Database}
                message={
                  searchQuery
                    ? "No datasets match your search."
                    : "No datasets yet — upload your first one to get started."
                }
                action={
                  searchQuery ? undefined : (
                    <Link href="/upload" className={cn(buttonVariants(), "h-11")}>
                      <Upload className="size-4" />
                      Upload dataset
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <ul className="space-y-3 lg:hidden">
                  {datasets.map((dataset) => (
                    <DatasetMobileCard
                      key={dataset.id}
                      dataset={dataset}
                      canEdit={canEditDatasetRow(dataset)}
                      canDelete={canDeleteDatasetRow(dataset)}
                      canSubmit={canSubmitDatasetRow(dataset)}
                      onSubmit={() => {
                        setSelectedDataset({ slug: dataset.slug, title: dataset.title });
                        setSubmitDialogOpen(true);
                      }}
                      onDelete={() => {
                        setSelectedDataset({ slug: dataset.slug, title: dataset.title });
                        setDeleteDialogOpen(true);
                      }}
                    />
                  ))}
                </ul>

                <div className="hidden overflow-hidden rounded-xl border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Dataset</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Visibility</th>
                          <th className="px-4 py-3 text-left font-medium">Downloads</th>
                          <th className="px-4 py-3 text-left font-medium">Updated</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {datasets.map((dataset) => (
                          <DatasetTableRow
                            key={dataset.id}
                            dataset={dataset}
                            canEdit={canEditDatasetRow(dataset)}
                            canDelete={canDeleteDatasetRow(dataset)}
                            canSubmit={canSubmitDatasetRow(dataset)}
                            onSubmit={() => {
                              setSelectedDataset({ slug: dataset.slug, title: dataset.title });
                              setSubmitDialogOpen(true);
                            }}
                            onDelete={() => {
                              setSelectedDataset({ slug: dataset.slug, title: dataset.title });
                              setDeleteDialogOpen(true);
                            }}
                            submitPending={submitDatasetMutation.isPending}
                            deletePending={deleteDatasetMutation.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Showing {datasets.length} of {meta?.total ?? 0} datasets
                </p>
              </>
            )}
          </div>
        </DashboardPanel>
      </DashboardPageContent>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit for review"
        description={`Submit "${selectedDataset?.title}" for admin review?`}
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
        description={`Archive "${selectedDataset?.title}"? Administrators can restore it later.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDatasetMutation.isPending}
      />
    </DashboardPage>
  );
}

type DatasetRow = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  status: DatasetStatus;
  visibility: DatasetVisibility;
  download_count?: number;
  updated_at: string;
  published_at?: string | null;
};

function DatasetMobileCard({
  dataset,
  canEdit,
  canDelete,
  canSubmit,
  onSubmit,
  onDelete,
}: {
  dataset: DatasetRow;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const hasActions = canEdit || canDelete || canSubmit;

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <Database className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/datasets/${dataset.slug}`}
              className="font-medium leading-snug hover:text-primary"
            >
              {dataset.title}
            </Link>
            {hasActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => router.push(`/datasets/${dataset.slug}`)}>
                    <Eye className="size-4" />
                    View
                  </DropdownMenuItem>
                  {canSubmit ? (
                    <DropdownMenuItem onClick={onSubmit}>
                      <Send className="size-4" />
                      Submit for review
                    </DropdownMenuItem>
                  ) : null}
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => router.push(`/edit/${dataset.slug}`)}>
                      <Edit className="size-4" />
                      Edit
                    </DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={onDelete}>
                        <Trash2 className="size-4" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{dataset.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
            <VisibilityBadge visibility={dataset.visibility} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {dataset.download_count?.toLocaleString() ?? 0} downloads · Updated{" "}
            {formatDate(dataset.updated_at)}
          </p>
        </div>
      </div>
    </li>
  );
}

function DatasetTableRow({
  dataset,
  canEdit,
  canDelete,
  canSubmit,
  onSubmit,
  onDelete,
  submitPending,
  deletePending,
}: {
  dataset: DatasetRow;
  canEdit: boolean;
  canDelete: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onDelete: () => void;
  submitPending: boolean;
  deletePending: boolean;
}) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <Database className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <Link
              href={`/datasets/${dataset.slug}`}
              className="font-medium hover:text-primary"
            >
              {dataset.title}
            </Link>
            <p className="line-clamp-1 text-xs text-muted-foreground">{dataset.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
      </td>
      <td className="px-4 py-3">
        <VisibilityBadge visibility={dataset.visibility} />
      </td>
      <td className="px-4 py-3 tabular-nums text-muted-foreground">
        {dataset.download_count?.toLocaleString() ?? 0}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(dataset.updated_at)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/datasets/${dataset.slug}`}>
            <Button size="icon" variant="ghost" className="size-9">
              <Eye className="size-4" />
            </Button>
          </Link>
          {canSubmit ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-9 text-success hover:text-success"
              onClick={onSubmit}
              disabled={submitPending}
              title="Submit for review"
            >
              <Send className="size-4" />
            </Button>
          ) : null}
          {canEdit ? (
            <Link href={`/edit/${dataset.slug}`}>
              <Button size="icon" variant="ghost" className="size-9">
                <Edit className="size-4" />
              </Button>
            </Link>
          ) : null}
          {canDelete ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-9 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={deletePending}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
