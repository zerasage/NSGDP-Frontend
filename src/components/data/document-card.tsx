import { Download, Lock, FileText, FileSpreadsheet, Presentation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalDocument, DocumentCategory } from "@/types";
import { cn } from "@/lib/utils";
import { statusPill } from "@/lib/constants/status-surfaces";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const CATEGORY_STYLES: Record<DocumentCategory, string> = {
  sop:        statusPill.blue,
  policy:     statusPill.purple,
  research:   statusPill.teal,
  report:     statusPill.amber,
  guideline:  statusPill.emerald,
  archive:    statusPill.gray,
  evaluation: statusPill.rose,
};

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  sop:        "SOP",
  policy:     "Policy",
  research:   "Research",
  report:     "Report",
  guideline:  "Guideline",
  archive:    "Archive",
  evaluation: "Evaluation",
};

function FormatIcon({ format }: { format: PortalDocument["fileFormat"] }) {
  if (format === "XLSX") return <FileSpreadsheet className="size-5 text-emerald-600" />;
  if (format === "PPTX") return <Presentation className="size-5 text-orange-600" />;
  return <FileText className="size-5 text-red-600" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface DocumentCardProps {
  doc: PortalDocument;
  className?: string;
  onDownload?: (doc: PortalDocument) => void;
}

export function DocumentCard({ doc, className, onDownload }: DocumentCardProps) {
  const handleDownload = () => {
    if (doc.restricted) {
      toast.error("This document requires special access. Contact data@nsphcda.ng");
      return;
    }
    if (onDownload) {
      onDownload(doc);
      return;
    }
    toast.success(`Downloading "${doc.title}" (mock)`);
  };

  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
        <FormatIcon format={doc.fileFormat} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          <h3 className="text-sm font-semibold leading-snug flex-1">{doc.title}</h3>
          {doc.restricted && (
            <span className={cn("inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 shrink-0", statusPill.amber)}>
              <Lock className="size-2.5" />
              Restricted
            </span>
          )}
        </div>

        {doc.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{doc.description}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-xs border-0", CATEGORY_STYLES[doc.category])}
          >
            {CATEGORY_LABELS[doc.category]}
          </Badge>
          <span className="text-xs text-muted-foreground">{doc.fileFormat}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formatBytes(doc.fileSizeBytes)}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-1">{doc.organisationName}</p>
      </div>

      <div className="shrink-0 flex items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={doc.restricted}
          aria-label={`Download ${doc.title}`}
        >
          <Download className="size-3.5 mr-1.5" />
          Download
        </Button>
      </div>
    </div>
  );
}
