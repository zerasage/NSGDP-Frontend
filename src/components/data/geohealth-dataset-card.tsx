"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, Download, Loader2 } from "lucide-react";
import type { Dataset } from "@/types";
import { HEALTH_CATEGORY_LABELS } from "@/lib/constants/health";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDownloadDataset } from "@/lib/hooks/useDatasets";
import { useAuth } from "@/lib/auth/auth-context";

interface GeoHealthDatasetCardProps {
  dataset: Dataset;
  className?: string;
  onInfoClick: (dataset: Dataset) => void;
}

export function GeoHealthDatasetCard({
  dataset,
  className,
  onInfoClick,
}: GeoHealthDatasetCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const downloadMutation = useDownloadDataset();

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Downloading requires an account (download counts, access logging) —
    // send anonymous visitors to sign in instead of letting the request
    // 401 and bounce them with a confusing "session expired" toast.
    if (!isAuthenticated) {
      toast.info("Sign in to download this dataset.");
      router.push(`/login?returnUrl=${encodeURIComponent(`/dataportal/${dataset.slug}`)}`);
      return;
    }

    downloadMutation.mutate(
      { slug: dataset.slug, mode: "download" },
      {
        onSuccess: (result) => {
          window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
        },
        onError: () => {
          toast.error(`Couldn't start the download for ${dataset.title}.`);
        },
      }
    );
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col transition-all hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onInfoClick(dataset)}
        className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border bg-background hover:bg-muted transition-colors"
        aria-label={`More information about ${dataset.title}`}
      >
        <Info className="size-4 text-muted-foreground" />
      </button>

      <CardHeader className="pb-2 pr-12">
        <Badge className="w-fit mb-2 bg-primary/10 text-primary border-0 text-xs">
          {HEALTH_CATEGORY_LABELS[dataset.healthCategory]}
        </Badge>
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
        <Button
          className="w-full bg-teal hover:bg-teal/90 text-teal-foreground font-semibold"
          onClick={handleDownload}
          disabled={downloadMutation.isPending}
        >
          {downloadMutation.isPending ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
