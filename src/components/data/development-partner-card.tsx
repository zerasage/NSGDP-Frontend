import Link from "next/link";
import Image from "next/image";
import { Database } from "lucide-react";
import type { DevelopmentPartner } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DevelopmentPartnerCardProps {
  organisation: DevelopmentPartner;
  className?: string;
}

export function DevelopmentPartnerCard({ organisation, className }: DevelopmentPartnerCardProps) {
  return (
    <Link href={`/development-partners/${organisation.slug}`}>
      <Card
        className={cn(
          "group transition-all hover:shadow-md hover:border-primary/50",
          className
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* Logo or Initials */}
            {organisation.logoUrl ? (
              <Image
                src={organisation.logoUrl}
                alt=""
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div
                className="flex size-12 items-center justify-center rounded-lg text-white font-bold text-lg"
                style={{
                  backgroundColor: organisation.brandColor || "#6366F1",
                }}
              >
                {organisation.acronym?.charAt(0) || organisation.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {organisation.name}
              </CardTitle>
              {organisation.acronym && (
                <p className="text-xs text-muted-foreground">
                  {organisation.acronym}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Sector Badge */}
          <Badge variant="secondary">{organisation.sector}</Badge>

          {/* Description */}
          {organisation.description && (
            <CardDescription className="line-clamp-2">
              {organisation.description}
            </CardDescription>
          )}

          {/* Dataset Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="size-4" />
            <span>
              {organisation.datasetCount} dataset{organisation.datasetCount !== 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
