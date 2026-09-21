"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MapOverlayToggleProps {
  label: string;
  onClick: () => void;
  className?: string;
  icon?: ReactNode;
  variant?: "default" | "secondary" | "outline";
}

/** Compact FAB used when a map overlay (summary, legend, rankings) is collapsed. */
export function MapOverlayToggle({
  label,
  onClick,
  className,
  icon,
  variant = "secondary",
}: MapOverlayToggleProps) {
  return (
    <Button
      size="sm"
      variant={variant}
      className={cn("z-[1000] shadow-lg", className)}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
