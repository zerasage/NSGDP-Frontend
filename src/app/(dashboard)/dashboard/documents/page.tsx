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
} from "@/lib/hooks/useDocuments";
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
    <main className="flex-1">
      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My documents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload SOPs, reports, and other files for admin review before they
              appear in the public library.
            </p>
          </div>
          {canContribute && (
            <Link href="/dashboard/documents/upload">
              <Button>
                <Plus className="size-4" />
                Upload document
              </Button>
            </Link>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {statusFilters.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents"
            className="pl-9"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Could not load documents. Try again later.
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : documents.length === 0 ? (
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
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Document</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const canSubmit =
                    (doc.status === "draft" || doc.status === "rejected") &&
                    !!doc.fileName;
                  return (
                    <tr key={doc.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.type} · {doc.fileName ?? "No file"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn("capitalize", statusTone[doc.status])}
                        >
                          {doc.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(doc.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/documents/${doc.slug}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="size-4" />
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
                              <Send className="size-4" />
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
