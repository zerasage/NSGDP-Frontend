"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  file: File; // Store the actual File object
  name: string;
  size: number;
  progress: number;
  format?: string;
  error?: string;
}

interface FileUploadAreaProps {
  files: UploadedFile[];
  onFilesChange: (update: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

function detectFormat(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    csv: "CSV",
    xlsx: "XLSX",
    xls: "XLSX",
    json: "JSON",
    gpkg: "GeoPackage",
  };
  return map[ext] ?? "Other";
}

const DEFAULT_DATASET_ACCEPT =
  ".csv,.xlsx,.xls,.json,.geojson,.gpkg,.kml,.kmz,.pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf,.md,.png,.jpg,.jpeg,.gif,.webp,.tif,.tiff";

function isAcceptedExtension(filename: string, accept: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  const allowed = accept
    .split(",")
    .map((part) => part.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);
  return allowed.includes(ext);
}

export function FileUploadArea({
  files,
  onFilesChange,
  accept = DEFAULT_DATASET_ACCEPT,
  maxSizeMB = 50,
  className,
}: FileUploadAreaProps) {
  const [dragOver, setDragOver] = useState(false);

  const simulateUpload = useCallback(
    (fileList: File[]) => {
      const newEntries: UploadedFile[] = fileList.map((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          return {
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            error: `File exceeds ${maxSizeMB}MB limit`,
          };
        }
        if (!isAcceptedExtension(file.name, accept)) {
          return {
            file,
            name: file.name,
            size: file.size,
            progress: 0,
            error:
              "Not allowed for datasets. Use CSV, Excel, JSON, or GeoPackage (.gpkg). For PDF and other files, upload via Documents.",
          };
        }
        return {
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          format: detectFormat(file.name),
        };
      });

      onFilesChange((prev) => [...prev, ...newEntries]);

      newEntries
        .filter((entry) => !entry.error)
        .forEach((entry) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            onFilesChange((prev) =>
              prev.map((f) =>
                f.name === entry.name ? { ...f, progress: Math.min(progress, 100) } : f
              )
            );
            if (progress >= 100) clearInterval(interval);
          }, 200);
        });
    },
    [accept, maxSizeMB, onFilesChange]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    simulateUpload(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    simulateUpload(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    onFilesChange(files.filter((f) => f.name !== name));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <Upload className="mx-auto size-10 text-muted-foreground mb-3" aria-hidden="true" />
        <p className="text-sm font-medium">Drag and drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">
          CSV, Excel, JSON, or GeoPackage · max {maxSizeMB}MB · PDFs go under Documents
        </p>
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Upload files"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Uploaded files">
          {files.map((file) => (
            <li
              key={file.name}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                file.error && "border-destructive/50 bg-destructive/5"
              )}
            >
              {file.error ? (
                <AlertCircle className="size-5 text-destructive shrink-0" />
              ) : (
                <FileText className="size-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.format && `${file.format} · `}
                  {formatBytes(file.size)}
                  {file.error && ` · ${file.error}`}
                </p>
                {!file.error && file.progress < 100 && (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {!file.error && file.progress === 100 && (
                  <p className="text-xs text-success mt-1">Upload complete</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(file.name)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
