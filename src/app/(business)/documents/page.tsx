"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "@/components/data/document-card";
import { useDocuments, useDownloadDocument } from "@/lib/hooks/useDocuments";
import type { DocumentCategory, PortalDocument } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES: Array<{ id: DocumentCategory | "all"; label: string }> = [
  { id: "all",        label: "All" },
  { id: "policy",     label: "Policies" },
  { id: "sop",        label: "SOPs" },
  { id: "report",     label: "Reports" },
  { id: "evaluation", label: "Evaluations" },
  { id: "guideline",  label: "Guidelines" },
  { id: "research",   label: "Research" },
];

export default function DocumentsPage() {
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = useDocuments({
    type: category === "all" ? undefined : category,
    search: query || undefined,
  });
  const downloadMutation = useDownloadDocument();

  const documents = useMemo(() => data?.data ?? [], [data]);

  const handleDownload = (doc: PortalDocument) => {
    downloadMutation.mutate(doc.slug, {
      onSuccess: (result) => {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to generate download link");
      },
    });
  };

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="size-7 text-primary" />
            <h1 className="text-3xl font-bold">Document Repository</h1>
          </div>
          <p className="text-muted-foreground">
            Policies, SOPs, research reports, evaluation findings, and historical archives for Niger State health data governance.
          </p>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-5">
          {/* Search */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
                  category === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span>Loading documents…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground gap-3">
              <BookOpen className="size-12 opacity-30" />
              <p className="font-medium">Couldn&apos;t load documents</p>
              <p className="text-sm">Please try again shortly</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {documents.length} document{documents.length !== 1 ? "s" : ""} found
              </p>

              {documents.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center text-muted-foreground gap-3">
                  <BookOpen className="size-12 opacity-30" />
                  <p className="font-medium">No documents found</p>
                  <p className="text-sm">Try changing your search or category filter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} onDownload={handleDownload} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
