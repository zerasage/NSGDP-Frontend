"use client";

import type { ReactNode } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobileMap } from "@/lib/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface MapFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Desktop drawer width — e.g. `md:w-80` or `md:w-96`. */
  widthClassName?: string;
  openLabel?: string;
  className?: string;
}

/**
 * Desktop: left slide-over drawer.
 * Mobile (&lt;md): bottom sheet with backdrop so the map stays visible.
 */
export function MapFilterSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  widthClassName = "md:w-80",
  openLabel = "Filters",
  className,
}: MapFilterSheetProps) {
  const isMobile = useIsMobileMap();

  return (
    <>
      {!open && (
        <Button
          size="sm"
          className="absolute left-3 top-3 z-[1000] shadow-lg md:left-4 md:top-4"
          onClick={() => onOpenChange(true)}
        >
          <Filter className="size-4 mr-1.5" />
          {openLabel}
        </Button>
      )}

      {open && isMobile && (
        <button
          type="button"
          aria-label="Close filters"
          className="absolute inset-0 z-[1100] bg-black/40"
          onClick={() => onOpenChange(false)}
        />
      )}

      <div
        role="dialog"
        aria-modal={isMobile && open}
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
        aria-label={typeof title === "string" ? title : "Map filters"}
        className={cn(
          "z-[1101] flex flex-col bg-background shadow-2xl transition-transform duration-300 ease-out",
          "w-full",
          widthClassName,
          // Desktop left drawer
          "md:absolute md:left-0 md:top-0 md:h-full md:max-w-[90vw] md:border-r",
          open ? "md:translate-x-0" : "md:-translate-x-full",
          // Mobile bottom sheet
          "absolute inset-x-0 bottom-0 h-[min(70dvh,100%)] rounded-t-2xl border-t",
          "md:inset-x-auto md:bottom-auto md:h-full md:rounded-none md:border-t-0",
          "pb-[env(safe-area-inset-bottom)]",
          open ? "translate-y-0" : "translate-y-full md:translate-y-0",
          !open && "pointer-events-none",
          className
        )}
      >
        {isMobile && (
          <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        <div className="flex shrink-0 items-start justify-between gap-2 border-b px-4 py-3 md:p-4">
          <div className="min-w-0">
            <h2 className="font-semibold leading-snug">{title}</h2>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close filters"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </>
  );
}
