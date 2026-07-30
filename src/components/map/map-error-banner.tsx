import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapErrorBannerProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function MapErrorBanner({
  message = "Failed to load data.",
  onRetry,
  className,
}: MapErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className
      )}
      role="alert"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <Button size="sm" variant="outline" onClick={onRetry} className="h-7 gap-1">
        <RotateCw className="size-3" />
        Retry
      </Button>
    </div>
  );
}
