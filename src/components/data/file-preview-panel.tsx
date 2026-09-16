"use client";

import type { ClipboardEvent as ReactClipboardEvent } from "react";
import { FileText, Database, Map as MapIcon } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DatasetMapSection } from "./dataset-map-section";
import type { DatasetFile } from "@/lib/api/datasets";
import { cn } from "@/lib/utils";

interface FilePreviewPanelProps {
  file: DatasetFile;
  preview?: unknown;
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  embedded?: boolean;
}

// Formats that show spatial (map + table) preview
const SPATIAL_FORMATS = ["geojson", "geopackage", "gpkg", "shapefile", "shp", "kml"];

// Formats that show tabular preview
const TABULAR_FORMATS = ["csv", "excel", "xlsx", "xls"];

// All previewable formats
const PREVIEWABLE_FORMATS = [...SPATIAL_FORMATS, ...TABULAR_FORMATS];

export function FilePreviewPanel({
  file,
  preview,
  isLoading,
  error,
  onRetry,
  className,
  embedded = false,
}: FilePreviewPanelProps) {
  const formatLower = file.format.toLowerCase();
  const isPreviewable = PREVIEWABLE_FORMATS.includes(formatLower);
  const isSpatial = SPATIAL_FORMATS.includes(formatLower);
  const isTabular = TABULAR_FORMATS.includes(formatLower);

  // Don't render panel for non-previewable formats
  if (!isPreviewable) {
    return null;
  }

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getPreviewTitle = (): string => {
    if (isSpatial) return "Spatial Preview";
    if (isTabular) return "Data Preview";
    return "Preview";
  };

  const getIcon = () => {
    if (isSpatial) return MapIcon;
    if (isTabular) return Database;
    return FileText;
  };

  const content = isLoading ? (
    <PreviewSkeleton isSpatial={isSpatial} />
  ) : error ? (
    <PreviewError error={error} onRetry={onRetry} />
  ) : isSpatial ? (
    <SpatialPreviewContent preview={preview} />
  ) : isTabular ? (
    <TabularPreviewContent preview={preview} />
  ) : (
    <UnsupportedPreview format={file.format} />
  );

  if (embedded) {
    return (
      <div className={cn("border bg-card p-4 sm:p-5", className)}>
        {content}
      </div>
    );
  }

  return (
    <DashboardPanel
      title={`${getPreviewTitle()} - ${file.file_name}`}
      icon={getIcon()}
      tone="info"
      className={className}
      action={
        <Badge variant="secondary">
          {file.format.toUpperCase()} · {formatBytes(file.file_size)}
        </Badge>
      }
    >
      {content}
    </DashboardPanel>
  );
}

function PreviewSkeleton({ isSpatial }: { isSpatial: boolean }) {
  if (isSpatial) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-h-[500px] space-y-3">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function PreviewError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || "Failed to load preview"}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function SpatialPreviewContent({ preview }: { preview: unknown }) {
  // Use the existing DatasetMapSection component which handles spatial previews
  // Wrap in a container with max height
  return (
    <div className="max-h-[500px] overflow-auto">
      <DatasetMapSection preview={preview} lgaCoverage={[]} />
    </div>
  );
}

function TabularPreviewContent({ preview }: { preview: unknown }) {
  const p = preview as {
    type?: string;
    columns?: string[];
    rows?: Array<Record<string, unknown>>;
    totalRows?: number | string;
    previewRows?: number;
    isPartialPreview?: boolean;
    message?: string;
  };

  if (!p || !p.columns || !p.rows || p.rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {p?.message || "No preview data available"}
      </div>
    );
  }

  // Copy is a light deterrent layered on top of the real protection (the
  // backend already caps this payload to ~20 rows) — swap the clipboard
  // content for an attribution note instead of blocking the event outright,
  // since a hard block just breaks screen readers / legitimate single-cell
  // copies without stopping anyone who actually wants the data (devtools,
  // screenshot+OCR, etc. all still work).
  const handleCopy = (event: ReactClipboardEvent<HTMLTableElement>) => {
    event.preventDefault();
    event.clipboardData.setData(
      "text/plain",
      "This is a limited preview from the National Statistics & Geospatial Data Platform. Request access to download the full dataset."
    );
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[500px] overflow-auto border rounded-lg">
        <table
          className="w-full text-sm select-none"
          onCopy={handleCopy}
        >
          <thead className="sticky top-0 bg-muted/50 backdrop-blur">
            <tr className="border-b">
              {p.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-2 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b hover:bg-muted/30">
                {p.columns!.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-2">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {p.isPartialPreview
          ? `Showing a limited preview (${p.previewRows || p.rows.length} rows). Request access to download the full dataset.`
          : "This is a preview only. Request access to download the full dataset."}
      </p>
    </div>
  );
}

function UnsupportedPreview({ format }: { format: string }) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      Preview not available for {format.toUpperCase()} format
    </div>
  );
}
