import Link from "next/link";
import Image from "next/image";
import { Download, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Dataset } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisibilityBadge } from "./visibility-badge";
import { LifecycleBadge } from "./lifecycle-badge";
import { cn } from "@/lib/utils";

interface DatasetCardProps {
  dataset: Dataset;
  className?: string;
}

export function DatasetCard({ dataset, className }: DatasetCardProps) {
  return (
    <Link href={`/dataportal/${dataset.slug}`}>
      <Card
        className={cn(
          "group relative flex flex-col transition-all duration-200 hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5",
          className
        )}
      >
        {/* Badges (top-right) */}
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
          <VisibilityBadge visibility={dataset.visibility} />
          {dataset.lifecycleStage &&
            dataset.lifecycleStage !== "approved" &&
            dataset.lifecycleStage !== "published" && (
            <LifecycleBadge stage={dataset.lifecycleStage} showDot={false} className="text-[10px] px-1.5 py-px" />
          )}
        </div>

        <CardHeader className="pb-3">
          {/* Organisation Header */}
          <div className="dataset-org-header flex items-center gap-2.5 mb-3">
            {dataset.organisation.logoUrl ? (
              <Image
                src={dataset.organisation.logoUrl}
                alt=""
                width={32}
                height={32}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                {dataset.organisation.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {dataset.organisation.name}
              </p>
              <p className="text-xs text-muted-foreground/70">Verified Source</p>
            </div>
          </div>

          {/* Title & Description */}
          <CardTitle className="text-lg line-clamp-2 pr-6 leading-snug">{dataset.title}</CardTitle>

          {dataset.description && (
            <CardDescription className="line-clamp-2 text-sm mt-2">
              {dataset.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {/* Topic Tags */}
          {dataset.groups.length > 0 && (
            <div className="dataset-topics flex flex-wrap gap-1.5">
              {dataset.groups.slice(0, 2).map((group) => (
                <Badge
                  key={group.id}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary border-0 font-medium"
                >
                  {group.name}
                </Badge>
              ))}
              {dataset.groups.length > 2 && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground border-0"
                >
                  +{dataset.groups.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Format Tags */}
          {dataset.formats.length > 0 && (
            <div className="dataset-formats flex flex-wrap gap-1.5">
              {dataset.formats.slice(0, 3).map((format) => (
                <Badge
                  key={format}
                  variant="outline"
                  className="text-xs font-mono bg-background"
                >
                  {format}
                </Badge>
              ))}
            </div>
          )}

          {/* Footer Metrics */}
          <div className="dataset-footer pt-3 border-t border-border/50 space-y-2.5">
            {dataset.dataLicense && (
              <p className="text-xs text-muted-foreground truncate">
                <span className="font-medium">License: </span>{dataset.dataLicense}
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3.5" />
                <span className="font-medium">
                  {formatDistanceToNow(new Date(dataset.updatedAt), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Download className="size-3.5 text-primary" />
                <span>{dataset.downloadCount.toLocaleString()}</span>
              </div>
            </div>
            {dataset.downloadCount > 100 && (
              <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                <TrendingUp className="size-3.5" />
                <span>Popular dataset</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
