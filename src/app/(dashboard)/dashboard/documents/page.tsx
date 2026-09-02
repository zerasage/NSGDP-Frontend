"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  Edit,
  Eye,
  Search,
  Send,
  RotateCcw,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrgDocuments, useSubmitDocumentForReview } from "@/lib/hooks/use-org-documents";
import { isOrgMember } from "@/lib/auth";
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
  PORTAL_DOCUMENTS_PAGE_TIP,
  PORTAL_DOCUMENTS_PENDING_METRIC_TIP,
  PORTAL_DOCUMENTS_STATUS_TIP,
} from "@/lib/constants/portal-tooltips";
import type { OrgDocumentStatus } from "@/lib/api/documents";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusFilters: { value: OrgDocumentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

const statusTone: Record<OrgDocumentStatus, string> = {
  draft: "bg-warning/15 text-amber-800 dark:text-warning",
  pending: "bg-warning/20 text-amber-900 dark:text-warning",
  under_review: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  published: "bg-success/20 text-success",
  archived: "bg-muted text-muted-foreground",
};

type DocumentRow = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: OrgDocumentStatus;
  fileName: string | null;
  updatedAt: string;
};

export default function MyDocumentsPage() {
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrgDocumentStatus | "all">("all");
  const [submitTarget, setSubmitTarget] = useState<{ slug: string; title: string } | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOrgDocuments(
    {
      page: 1,
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
      organisationId: user?.organisationId,
    },
    { enabled: !!user?.id },
  );

  const { data: countsData } = useOrgDocuments(
    { page: 1, limit: 100, organisationId: user?.organisationId },
    { enabled: !!user?.id },
  );

  const submitMutation = useSubmitDocumentForReview();

  const documents = data?.data ?? [];
  const meta = data?.meta;
  const allDocuments = countsData?.data ?? [];
  const canContribute = isOrgMember(user?.role);

  if (authLoading || !allowed) {
    return null;
  }

  const statusCounts: Record<OrgDocumentStatus | "all", number> = {
    all: allDocuments.length,
    draft: allDocuments.filter((d) => d.status === "draft").length,
    pending: allDocuments.filter((d) => d.status === "pending").length,
    under_review: allDocuments.filter((d) => d.status === "under_review").length,
    approved: allDocuments.filter((d) => d.status === "approved").length,
    rejected: allDocuments.filter((d) => d.status === "rejected").length,
    published: allDocuments.filter((d) => d.status === "published").length,
    archived: allDocuments.filter((d) => d.status === "archived").length,
  };

  const canSubmitDocument = (doc: DocumentRow) =>
    canContribute &&
    (doc.status === "draft" || doc.status === "rejected") &&
    !!doc.fileName;

  const confirmSubmit = () => {
    if (!submitTarget) return;
    submitMutation.mutate(submitTarget.slug, {
      onSuccess: () => {
        toast.success("Submitted for admin review");
        setSubmitTarget(null);
      },
      onError: (err: Error) => toast.error(err.message || "Failed to submit for review"),
    });
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
              <FileText className="size-3.5 text-success" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                Organisation
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Documents
              <HelpTip content={PORTAL_DOCUMENTS_PAGE_TIP} label="Documents page help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload SOPs, reports, and files for admin review before they appear in the public
              library.
            </p>
          </div>
          {canContribute ? (
            <Link
              href="/dashboard/documents/upload"
              className={cn(buttonVariants(), "h-11 shrink-0 gap-2 sm:h-10")}
            >
              <Upload className="size-4" />
              Upload document
            </Link>
          ) : null}
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total"
            value={statusCounts.all}
            hint="All organisation documents"
            icon={FileText}
            tone="success"
          />
          <MetricCard
            label="Pending"
            value={statusCounts.pending + statusCounts.under_review}
            hint="Awaiting review"
            icon={Send}
            tone="warning"
            tip={PORTAL_DOCUMENTS_PENDING_METRIC_TIP}
            onClick={() => setStatusFilter("pending")}
          />
          <MetricCard
            label="Published"
            value={statusCounts.published}
            hint="In public library"
            icon={CheckCircle2}
            tone="info"
            onClick={() => setStatusFilter("published")}
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
          title="Your documents"
          titleTip={PORTAL_DOCUMENTS_STATUS_TIP}
          description="Filter by status or search by title and type."
          icon={FileText}
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
                placeholder="Search documents…"
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
                icon={FileText}
                message="Failed to load documents."
                action={
                  <Button variant="outline" className="h-11" onClick={() => void refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : documents.length === 0 ? (
              <EmptyPanelState
                icon={FileText}
                message={
                  searchQuery
                    ? "No documents match your search."
                    : "No documents yet — upload your first one to get started."
                }
                action={
                  searchQuery || !canContribute ? undefined : (
                    <Link
                      href="/dashboard/documents/upload"
                      className={cn(buttonVariants(), "h-11")}
                    >
                      <Upload className="size-4" />
                      Upload document
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <ul className="space-y-3 lg:hidden">
                  {documents.map((doc) => (
                    <DocumentMobileCard
                      key={doc.id}
                      document={doc}
                      canSubmit={canSubmitDocument(doc)}
                      onSubmit={() => setSubmitTarget({ slug: doc.slug, title: doc.title })}
                    />
                  ))}
                </ul>

                <div className="hidden overflow-hidden rounded-xl border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Document</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Updated</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {documents.map((doc) => (
                          <DocumentTableRow
                            key={doc.id}
                            document={doc}
                            canSubmit={canSubmitDocument(doc)}
                            onSubmit={() => setSubmitTarget({ slug: doc.slug, title: doc.title })}
                            submitPending={submitMutation.isPending}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Showing {documents.length} of {meta?.total ?? documents.length} documents
                </p>
              </>
            )}
          </div>
        </DashboardPanel>
      </DashboardPageContent>

      <ConfirmDialog
        open={!!submitTarget}
        onOpenChange={(open) => !open && setSubmitTarget(null)}
        title="Submit for review"
        description={`Submit "${submitTarget?.title}" to the NSGDP document review queue?`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        isLoading={submitMutation.isPending}
        onConfirm={confirmSubmit}
      />
    </DashboardPage>
  );
}

function DocumentStatusBadge({ status }: { status: OrgDocumentStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", statusTone[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function DocumentMobileCard({
  document,
  canSubmit,
  onSubmit,
}: {
  document: DocumentRow;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  const router = useRouter();

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/documents/${document.slug}`}
              className="font-medium leading-snug hover:text-primary"
            >
              {document.title}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/documents/${document.slug}`)}
                >
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
                {canSubmit ? (
                  <DropdownMenuItem onClick={onSubmit}>
                    <Send className="size-4" />
                    Submit for review
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {document.type} · {document.fileName ?? "No file attached"}
          </p>
          <div className="mt-3">
            <DocumentStatusBadge status={document.status} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Updated {formatDate(document.updatedAt)}
          </p>
        </div>
      </div>
    </li>
  );
}

function DocumentTableRow({
  document,
  canSubmit,
  onSubmit,
  submitPending,
}: {
  document: DocumentRow;
  canSubmit: boolean;
  onSubmit: () => void;
  submitPending: boolean;
}) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <Link
              href={`/dashboard/documents/${document.slug}`}
              className="font-medium hover:text-primary"
            >
              {document.title}
            </Link>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {document.type} · {document.fileName ?? "No file attached"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <DocumentStatusBadge status={document.status} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(document.updatedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Link href={`/dashboard/documents/${document.slug}`}>
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
        </div>
      </td>
    </tr>
  );
}
