"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * Overlay open state that defaults open on desktop and closed on mobile.
 * Waits for the first media-query resolution so SSR/hydration stay stable.
 */
export function useMapOverlayOpen(desktopDefault = true): [boolean, (open: boolean) => void] {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const applied = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isMobile === null || applied.current) return;
    applied.current = true;
    setOpen(desktopDefault && !isMobile);
  }, [isMobile, desktopDefault]);

  return [open, setOpen];
}

/** Leaflet ZoomControl position — bottom-right on phones to clear the Filters FAB. */
export function useMapZoomPosition(): "topleft" | "bottomright" {
  const isMobile = useMediaQuery("(max-width: 767px)");
  // null (pre-hydrate) → topleft; true → bottomright
  return isMobile === true ? "bottomright" : "topleft";
}

export const MAP_VIEWPORT_CLASS = "relative h-[calc(100dvh-4rem)] w-full overflow-hidden";
