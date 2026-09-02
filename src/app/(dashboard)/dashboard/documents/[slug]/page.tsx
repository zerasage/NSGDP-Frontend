"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  Info,
  MessageSquare,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HelpTip } from "@/components/ui/help-tip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import {
  useOrgDocumentBySlug,
  useSubmitDocumentForReview,
} from "@/lib/hooks/use-org-documents";
import { useDownloadDocument } from "@/lib/hooks/useDocuments";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import {
  PORTAL_DOCUMENT_DETAIL_PAGE_TIP,
  PORTAL_DOCUMENT_FILE_TIP,
  PORTAL_DOCUMENT_INFO_TIP,
  PORTAL_DOCUMENT_SUBMIT_TIP,
} from "@/lib/constants/portal-tooltips";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OrgDocument, OrgDocumentStatus } from "@/lib/api/documents";

const statusTone: Record<OrgDocumentStatus, string> = {
  draft: "bg-warning/15 text-amber-800 dark:text-warning",
  pending: "bg-warning/20 text-amber-900 dark:text-warning",
  under_review: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  published: "bg-success/20 text-success",
  archived: "bg-muted text-muted-foreground",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function DocumentStatusBadge({ status }: { status: OrgDocumentStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", statusTone[status])}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function OrgDocumentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isLoading: authLoading, allowed } = useRequireOrgMember();
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const { data: document, isLoading, error } = useOrgDocumentBySlug(slug);
  const submitMutation = useSubmitDocumentForReview();
  const downloadMutation = useDownloadDocument();

  if (authLoading || !allowed) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-10 w-full max-w-xs" />
          </div>
        </div>
        <DashboardPageContent className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (error || !document) {
    notFound();
  }

  const canSubmit =
    (document.status === "draft" || document.status === "rejected") && !!document.fileName;

  const confirmSubmit = () => {
    submitMutation.mutate(document.slug, {
      onSuccess: () => {
        toast.success("Submitted for admin review");
        setSubmitDialogOpen(false);
      },
      onError: (err: Error) => toast.error(err.message || "Failed to submit for review"),
    });
  };

  const handleDownload = () => {
    downloadMutation.mutate(document.slug, {
      onSuccess: (data) => {
        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        toast.success(`Downloading ${data.fileName}`);
      },
      onError: (err: Error) => toast.error(err.message || "Failed to download document"),
    });
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href="/dashboard/documents" className="hover:text-foreground">
            Documents
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <span className="truncate text-foreground">{document.title}</span>
        </nav>
      </div>

      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="space-y-4">
          <div className="min-w-0">
            <DocumentStatusBadge status={document.status} />
            <h1 className="mt-2 flex items-start gap-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
              <span className="min-w-0">{document.title}</span>
              <HelpTip
                content={PORTAL_DOCUMENT_DETAIL_PAGE_TIP}
                label="Document detail help"
                className="mt-0.5"
              />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {document.type} · Updated {formatDate(document.updatedAt)}
            </p>
          </div>

          {document.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/documents"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 gap-2 sm:h-9")}
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>

            {canSubmit ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  className="h-10 gap-2 sm:h-9"
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={submitMutation.isPending}
                >
                  <Send className="size-4" />
                  {document.status === "rejected" ? "Resubmit" : "Submit for review"}
                </Button>
                <HelpTip content={PORTAL_DOCUMENT_SUBMIT_TIP} label="Submit for review help" />
              </div>
            ) : null}

            {document.fileName ? (
              <Button
                size="sm"
                variant="outline"
                className="h-10 gap-2 sm:h-9"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                <Download className="size-4" />
                Download
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
                {document.description || "No description provided."}
              </p>
            </DashboardPanel>

            <DashboardPanel
              title="File"
              titleTip={PORTAL_DOCUMENT_FILE_TIP}
              icon={FileText}
              tone="primary"
            >
              {document.fileName ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{document.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.mimeType?.split("/").pop()?.toUpperCase() ?? "File"} ·{" "}
                        {formatBytes(document.fileSizeBytes)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 w-full shrink-0 gap-2 sm:h-9 sm:w-auto"
                    onClick={handleDownload}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="size-4" />
                    Download file
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No file attached yet.</p>
              )}
            </DashboardPanel>

            {document.reviewComment ? (
              <DashboardPanel
                title="Reviewer feedback"
                icon={MessageSquare}
                tone="warning"
                description="Comments from NSGDP admins during review."
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {document.reviewComment}
                </p>
              </DashboardPanel>
            ) : null}
          </div>

          <div className="space-y-4 lg:space-y-6">
            <DashboardPanel
              title="Document info"
              titleTip={PORTAL_DOCUMENT_INFO_TIP}
              icon={Info}
              tone="success"
            >
              <DocumentInfoSidebar document={document} />
            </DashboardPanel>
          </div>
        </div>
      </DashboardPageContent>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        title="Submit for review"
        description={`Submit "${document.title}" to the NSGDP document review queue?`}
        confirmLabel="Submit"
        cancelLabel="Cancel"
        isLoading={submitMutation.isPending}
        onConfirm={confirmSubmit}
      />
    </DashboardPage>
  );
}

function DocumentInfoSidebar({ document }: { document: OrgDocument }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Type</dt>
        <dd className="font-medium capitalize">{document.type.replace(/_/g, " ")}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <DocumentStatusBadge status={document.status} />
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Created</dt>
        <dd className="font-medium tabular-nums">
          {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Updated</dt>
        <dd className="font-medium tabular-nums">{formatDate(document.updatedAt)}</dd>
      </div>
      {document.submittedAt ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Submitted</dt>
          <dd className="font-medium tabular-nums">{formatDate(document.submittedAt)}</dd>
        </div>
      ) : null}
      {document.publishedAt ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Published</dt>
          <dd className="font-medium tabular-nums">{formatDate(document.publishedAt)}</dd>
        </div>
      ) : null}
      {document.programmeId ? (
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Programme</dt>
          <dd className="truncate font-medium">{document.programmeId}</dd>
        </div>
      ) : null}
    </dl>
  );
}
