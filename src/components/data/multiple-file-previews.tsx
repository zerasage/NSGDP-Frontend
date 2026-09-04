"use client";

import { useState } from "react";
import { ChevronRight, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFilePreview } from "@/lib/hooks/useDatasets";
import type { DatasetFile } from "@/lib/api/datasets";
import { FilePreviewPanel } from "./file-preview-panel";

const PREVIEWABLE_FORMATS = [
  "csv",
  "excel",
  "xlsx",
  "xls",
  "geojson",
  "json",
  "geopackage",
  "gpkg",
  "shapefile",
  "shp",
  "kml",
];

export function MultipleFilePreviews({ slug, files }: { slug: string; files: DatasetFile[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const previewableFiles = files.filter((file) =>
    PREVIEWABLE_FORMATS.includes(file.format.toLowerCase()),
  );

  if (previewableFiles.length === 0) return null;

  const currentFile = previewableFiles[currentIndex];
  const totalFiles = previewableFiles.length;
  const goToPrevious = () =>
    setCurrentIndex((previous) => (previous === 0 ? totalFiles - 1 : previous - 1));
  const goToNext = () =>
    setCurrentIndex((previous) => (previous === totalFiles - 1 ? 0 : previous + 1));

  return (
    <>
      <div className="relative">
        <div className="flex flex-col gap-3 rounded-t-2xl border border-b-0 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              File preview
            </p>
            <p className="truncate text-sm font-semibold" title={currentFile.file_name}>
              {currentFile.file_name}
            </p>
            {totalFiles > 1 ? (
              <p className="text-xs text-muted-foreground">
                Preview {currentIndex + 1} of {totalFiles} dataset files
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {totalFiles > 1 ? (
              <div className="flex items-center rounded-lg border bg-background p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevious}
                  aria-label="Previous file"
                >
                  <ChevronRight className="size-4 rotate-180" />
                </Button>
                <span className="px-2 text-xs tabular-nums text-muted-foreground">
                  {currentIndex + 1}/{totalFiles}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={goToNext}
                  aria-label="Next file"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setFullScreenOpen(true)}
              aria-label="Open full screen"
            >
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>

        <FilePreviewWrapper
          slug={slug}
          file={currentFile}
          className="rounded-b-2xl"
          embedded
        />
      </div>

      <Dialog open={fullScreenOpen} onOpenChange={setFullScreenOpen}>
        <DialogContent className="h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-4 sm:max-w-none sm:p-6">
          <DialogHeader className="pr-10">
            <DialogTitle className="truncate">{currentFile.file_name}</DialogTitle>
            <DialogDescription>
              File preview {currentIndex + 1} of {totalFiles}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-auto">
            {totalFiles > 1 ? (
              <div className="sticky top-0 z-10 mb-3 flex items-center justify-center gap-2 border-b bg-popover/95 pb-3 backdrop-blur">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  className="gap-2"
                >
                  <ChevronRight className="size-4 rotate-180" />
                  Previous file
                </Button>
                <span className="px-2 text-sm tabular-nums text-muted-foreground">
                  {currentIndex + 1} of {totalFiles}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  className="gap-2"
                >
                  Next file
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}

            <FilePreviewWrapper
              slug={slug}
              file={currentFile}
              className="rounded-xl"
              embedded
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilePreviewWrapper({
  slug,
  file,
  className,
  embedded,
}: {
  slug: string;
  file: DatasetFile;
  className?: string;
  embedded?: boolean;
}) {
  const { data, isLoading, error, refetch } = useFilePreview(slug, file.id, true);

  return (
    <FilePreviewPanel
      file={file}
      preview={data?.preview}
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={() => refetch()}
      className={className}
      embedded={embedded}
    />
  );
}
