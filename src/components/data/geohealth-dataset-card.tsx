"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import type { Dataset } from "@/types";
import { HEALTH_CATEGORY_LABELS } from "@/lib/constants/health";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DatasetDownloadActions } from "@/components/data/dataset-download-actions";
import { VisibilityBadge } from "@/components/data/visibility-badge";

interface GeoHealthDatasetCardProps {
  dataset: Dataset;
  className?: string;
  onInfoClick: (dataset: Dataset) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (slug: string) => void;
}

export function GeoHealthDatasetCard({
  dataset,
  className,
  onInfoClick,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: GeoHealthDatasetCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col transition-all hover:shadow-lg hover:border-primary/30",
        selectionMode && selected && "border-primary ring-1 ring-primary/40",
        className
      )}
    >
      {selectionMode ? (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.(dataset.slug)}
            aria-label={`Select ${dataset.title} for bulk download`}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onInfoClick(dataset)}
        className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border bg-background hover:bg-muted transition-colors"
        aria-label={`More information about ${dataset.title}`}
      >
        <Info className="size-4 text-muted-foreground" />
      </button>

      <CardHeader className={cn("pb-2 pr-12", selectionMode && "pl-12")}>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Badge className="w-fit bg-primary/10 text-primary border-0 text-xs">
            {HEALTH_CATEGORY_LABELS[dataset.healthCategory]}
          </Badge>
          {dataset.visibility !== "public" && (
            <VisibilityBadge visibility={dataset.visibility} />
          )}
        </div>
        <CardTitle className="text-base line-clamp-2 leading-snug">
          <Link href={`/dataportal/${dataset.slug}`} className="hover:text-primary">
            {dataset.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {dataset.organisation.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {dataset.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {dataset.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {dataset.formats.slice(0, 3).map((f) => (
            <Badge key={f} variant="outline" className="text-[10px] font-mono">
              {f}
            </Badge>
          ))}
        </div>
        {!selectionMode && (
          <DatasetDownloadActions
            datasetId={dataset.id}
            datasetSlug={dataset.slug}
            datasetTitle={dataset.title}
            visibility={dataset.visibility}
            datasetOrganisationId={dataset.organisation.id}
          />
        )}
      </CardContent>
    </Card>
  );
}
