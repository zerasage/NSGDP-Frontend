"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useOrgDocumentBySlug,
  useSubmitDocumentForReview,
} from "@/lib/hooks/use-org-documents";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OrgDocumentStatus } from "@/lib/api/documents";

const statusTone: Record<OrgDocumentStatus, string> = {
  draft: "bg-yellow-500/10 text-yellow-800",
  pending: "bg-amber-500/10 text-amber-800",
  under_review: "bg-blue-500/10 text-blue-800",
  approved: "bg-emerald-500/10 text-emerald-800",
  rejected: "bg-red-500/10 text-red-800",
  published: "bg-green-500/10 text-green-800",
  archived: "bg-muted text-muted-foreground",
};

export default function OrgDocumentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: document, isLoading, error } = useOrgDocumentBySlug(slug);
  const submitMutation = useSubmitDocumentForReview();

  if (isLoading) {
    return (
      <Container className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading…
      </Container>
    );
  }

  if (error || !document) {
    return (
      <Container className="py-16 text-center text-muted-foreground">
        Document not found, or you do not have access.
        <div className="mt-4">
          <Link href="/dashboard/documents">
            <Button variant="outline">Back to My documents</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const canSubmit =
    (document.status === "draft" || document.status === "rejected") &&
    !!document.fileName;

  const handleSubmit = () => {
    submitMutation.mutate(document.slug, {
      onSuccess: () => toast.success("Submitted for admin review"),
      onError: (err: Error) =>
        toast.error(err.message || "Failed to submit for review"),
    });
  };

  return (
    <main className="flex-1">
      <Container className="max-w-3xl py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <Badge
                variant="secondary"
                className={cn("capitalize", statusTone[document.status])}
              >
                {document.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {document.type} · Updated {formatDate(document.updatedAt)}
            </p>
          </div>
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
              <Send className="size-4" />
              {document.status === "rejected" ? "Resubmit" : "Submit for review"}
            </Button>
          )}
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {document.description}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              File
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {document.fileName ?? "No file attached yet"}
          </CardContent>
        </Card>

        {document.reviewComment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reviewer feedback</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {document.reviewComment}
            </CardContent>
          </Card>
        )}
      </Container>
    </main>
  );
}
