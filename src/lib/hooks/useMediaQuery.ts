"use client";

import { useEffect, useState } from "react";

/**
 * Client-only matchMedia subscription.
 * Returns `null` until mounted so callers can wait before applying defaults.
 */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Tailwind `md` breakpoint — phone / small tablet portrait. False until hydrated. */
export function useIsMobileMap(): boolean {
  return useMediaQuery("(max-width: 767px)") ?? false;
}
