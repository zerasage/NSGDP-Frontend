"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Database, Upload, Edit, Trash2, Eye, Search, Send } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/data/status-badge";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOrganizationDatasets, useDeleteDataset, useSubmitDatasetForReview } from "@/lib/hooks/useDatasets";
import { useAuth } from "@/lib/auth";
import type { DatasetStatus } from "@/types";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

// Backend status values: draft, pending, under_review, approved, rejected, archived
const statusFilters: { value: DatasetStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "draft", label: "Drafts" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export default function MyDatasetsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DatasetStatus | "all">(
    (searchParams?.get("status") as DatasetStatus) || "all"
  );
  const limit = 50;

  // Dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<{ slug: string; title: string } | null>(null);

  // Fetch datasets from authenticated organization endpoint
  // This endpoint shows ALL statuses (draft, pending, approved, etc.) for the user's org
  const { data, isLoading, error } = useOrganizationDatasets(
    {
      page: 1,
      limit,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
    },
    { enabled: !!user?.id } // Only fetch when user is authenticated
  );

  // Separate, always-unfiltered fetch used only to compute the tab counts —
  // decoupled from `data` above (which is scoped to the active status tab).
  // Deriving counts from the filtered list meant every other tab's count
  // collapsed to 0 the moment you selected one, since that list only ever
  // contained rows matching the currently-selected status.
  const { data: countsData } = useOrganizationDatasets(
    { page: 1, limit: 100 }, // backend caps limit at 100 (PaginationDto)
    { enabled: !!user?.id }
  );
  const allDatasetsForCounts = countsData?.data || [];

  const deleteDatasetMutation = useDeleteDataset();
  const submitDatasetMutation = useSubmitDatasetForReview();

  const datasets = data?.data || [];
  const meta = data?.meta;

  // Permission helpers
  const canEditDataset = (dataset: typeof datasets[0]) => {
    if (!user) return false;
    
    // Admin can edit all org datasets (including approved - which triggers re-approval)
    if (user.role === "admin") return true;
    
    // Approved datasets cannot be edited by contributors (even if they own it)
    if (dataset.status === "approved") return false;
    
    // Contributor can only edit their own non-approved datasets
    if (user.role === "contributor" && dataset.owner_id === user.id) return true;
    
    return false;
  };

  const canDeleteDataset = (dataset: typeof datasets[0]) => {
    if (!user) return false;
    
    const deletableStatuses = ["draft", "rejected", "pending", "approved"];
    
    // Admin can delete draft, rejected, pending, and approved datasets
    if (user.role === "admin" && deletableStatuses.includes(dataset.status)) {
      return true;
    }
    
    // Contributor can only delete their OWN draft or rejected datasets
    // Once approved, only admin can delete (even if contributor owns it)
    if (user.role === "contributor" && dataset.owner_id === user.id) {
      return dataset.status === "draft" || dataset.status === "rejected";
    }
    
    return false;
  };

  const handleDelete = (slug: string, title: string) => {
    setSelectedDataset({ slug, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedDataset) return;
    
    deleteDatasetMutation.mutate(selectedDataset.slug, {
      onSuccess: () => {
        toast.success("Dataset archived successfully");
        setSelectedDataset(null);
      },
      onError: () => {
        toast.error("Failed to archive dataset");
      },
    });
  };

  const handleSubmitForReview = (slug: string, title: string) => {
    setSelectedDataset({ slug, title });
    setSubmitDialogOpen(true);
  };

  const confirmSubmit = () => {
    if (!selectedDataset) return;
    
    submitDatasetMutation.mutate(selectedDataset.slug, {
      onSuccess: () => {
        toast.success("Dataset submitted for review successfully");
        setSelectedDataset(null);
      },
      onError: (error: Error) => {
        toast.error((error as Error)?.message || "Failed to submit dataset for review");
      },
    });
  };

  // Check if user can submit dataset for review
  const canSubmitDataset = (dataset: typeof datasets[0]) => {
    // Only draft or rejected datasets can be submitted
    if (dataset.status !== "draft" && dataset.status !== "rejected") {
      return false;
    }
    
    // Admin can submit any org dataset
    if (user?.role === "admin") {
      return true;
    }
    
    // Contributor can only submit their own datasets
    if (user?.role === "contributor" && dataset.owner_id === user.id) {
      return true;
    }
    
    return false;
  };

  // Count by status from the unfiltered fetch, not the active tab's list
  const statusCounts: Record<DatasetStatus | "all", number> = {
    all: allDatasetsForCounts.length,
    approved: allDatasetsForCounts.filter((d) => d.status === "approved").length,
    pending: allDatasetsForCounts.filter((d) => d.status === "pending").length,
    under_review: allDatasetsForCounts.filter((d) => d.status === "under_review").length,
    draft: allDatasetsForCounts.filter((d) => d.status === "draft").length,
    rejected: allDatasetsForCounts.filter((d) => d.status === "rejected").length,
    archived: allDatasetsForCounts.filter((d) => d.status === "archived").length,
  };

  return (
    <main className="flex-1 bg-muted/40">
      <div className="border-b bg-background">
        <Container size="wide" className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Datasets</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your organization&apos;s datasets and track their status
              </p>
            </div>
            <Link href="/upload">
              <Button>
                <Upload className="size-4 mr-2" />
                Upload New Dataset
              </Button>
            </Link>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted border"
              }`}
            >
              {filter.label}
              {statusCounts[filter.value] > 0 && (
                <span className="ml-2 opacity-75">({statusCounts[filter.value]})</span>
              )}
            </button>
          ))}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            size="sm"
            className="ml-auto"
          >
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load datasets</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        ) : datasets.length === 0 ? (
          <EmptyState
            icon={Database}
            title={searchQuery ? "No datasets found" : "No datasets yet"}
            description={
              searchQuery
                ? "Try adjusting your search or filters"
                : "Upload your first dataset to get started. Datasets will appear here once approved."
            }
            action={
              searchQuery
                ? undefined
                : {
                    label: "Upload Dataset",
                    onClick: () => (window.location.href = "/upload"),
                  }
            }
          />
        ) : (
          <>
            {/* Datasets Table */}
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Dataset</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Visibility</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Downloads</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Last Updated</th>
                      <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {datasets.map((dataset) => (
                      <tr
                        key={dataset.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <Database className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <Link
                                href={`/datasets/${dataset.slug}`}
                                className="font-medium hover:text-primary transition-colors block mb-1"
                              >
                                {dataset.title}
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {dataset.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
                        </td>
                        <td className="px-6 py-4">
                          <VisibilityBadge visibility={dataset.visibility} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {dataset.download_count?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {formatDate(dataset.updated_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/datasets/${dataset.slug}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="size-4" />
                              </Button>
                            </Link>
                            {canSubmitDataset(dataset) && (
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleSubmitForReview(dataset.slug, dataset.title)}
                                disabled={submitDatasetMutation.isPending}
                                title="Submit for review"
                              >
                                <Send className="size-4" />
                              </Button>
                            )}
                            {canEditDataset(dataset) && (
                              <Link href={`/edit/${dataset.slug}`}>
                                <Button size="sm" variant="ghost">
                                  <Edit className="size-4" />
                                </Button>
                              </Link>
                            )}
                            {canDeleteDataset(dataset) && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(dataset.slug, dataset.title)}
                                disabled={deleteDatasetMutation.isPending}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              Showing {datasets.length} of {meta?.total || 0} datasets
            </p>
          </>
        )}
      </Container>

      {/* Submit for Review Dialog */}
      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit for Review"
        description={`Submit "${selectedDataset?.title}" for review? It will be sent to administrators for approval.`}
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
        description={`Are you sure you want to archive "${selectedDataset?.title}"? This action can be reversed by administrators.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteDatasetMutation.isPending}
      />
    </main>
  );
}
