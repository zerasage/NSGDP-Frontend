"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Send, Eye } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useOrgDocuments,
  useSubmitDocumentForReview,
} from "@/lib/hooks/use-org-documents";
import { useAuth } from "@/lib/auth";
import type { OrgDocumentStatus } from "@/lib/api/documents";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusFilters: { value: OrgDocumentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "published", label: "Published" },
];

const statusTone: Record<OrgDocumentStatus, string> = {
  draft: "bg-yellow-500/10 text-yellow-800",
  pending: "bg-amber-500/10 text-amber-800",
  under_review: "bg-blue-500/10 text-blue-800",
  approved: "bg-emerald-500/10 text-emerald-800",
  rejected: "bg-red-500/10 text-red-800",
  published: "bg-green-500/10 text-green-800",
  archived: "bg-muted text-muted-foreground",
};

export default function MyDocumentsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrgDocumentStatus | "all">(
    "all"
  );
  const [submitTarget, setSubmitTarget] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const { data, isLoading, error } = useOrgDocuments(
    {
      page: 1,
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchQuery || undefined,
      organisationId: user?.organisationId,
    },
    { enabled: !!user?.id }
  );

  const submitMutation = useSubmitDocumentForReview();
  const documents = (data?.data ?? []).filter((doc) => {
    // List endpoint returns published + own-org; keep org-scoped view.
    if (!user?.organisationId) return true;
    return true;
  });

  const canContribute =
    user && ["contributor", "admin"].includes(user.role);

  const confirmSubmit = () => {
    if (!submitTarget) return;
    submitMutation.mutate(submitTarget.slug, {
      onSuccess: () => {
        toast.success("Submitted for admin review");
        setSubmitTarget(null);
      },
      onError: (err: Error) =>
        toast.error(err.message || "Failed to submit for review"),
    });
  };

  return (
    <main className="flex-1 bg-muted/40">
      <div className="border-b bg-background">
        <Container size="wide" className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <h1 className="text-lg font-semibold tracking-tight">
                My documents
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Upload SOPs, reports, and other files for admin review before
                they appear in the public library.
              </p>
            </div>
            {canContribute && (
              <Link href="/dashboard/documents/upload">
                <Button size="sm">
                  <Plus className="size-4" />
                  Upload document
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </div>

      <Container size="wide" className="space-y-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents…"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Could not load documents. Try again later.
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg border bg-background"
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-lg border bg-background">
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload a document to start the review workflow."
              action={
                canContribute
                  ? {
                      label: "Upload document",
                      href: "/dashboard/documents/upload",
                    }
                  : undefined
              }
              className="py-10"
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Document</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Updated</th>
                    <th className="px-4 py-2.5 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const canSubmit =
                      (doc.status === "draft" || doc.status === "rejected") &&
                      !!doc.fileName;
                    return (
                      <tr
                        key={doc.id}
                        className="border-t transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <div className="font-medium leading-snug">
                            {doc.title}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {doc.type} · {doc.fileName ?? "No file"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "capitalize",
                              statusTone[doc.status]
                            )}
                          >
                            {doc.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-muted-foreground whitespace-nowrap">
                          {formatDate(doc.updatedAt)}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/dashboard/documents/${doc.slug}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="size-3.5" />
                                View
                              </Button>
                            </Link>
                            {canSubmit && canContribute && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setSubmitTarget({
                                    slug: doc.slug,
                                    title: doc.title,
                                  })
                                }
                              >
                                <Send className="size-3.5" />
                                Submit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!submitTarget}
          onOpenChange={(open) => !open && setSubmitTarget(null)}
          title="Submit for review?"
          description={`Submit "${submitTarget?.title}" to the NSGDP document review queue?`}
          confirmLabel="Submit"
          isLoading={submitMutation.isPending}
          onConfirm={confirmSubmit}
        />
      </Container>
    </main>
  );
}
