"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

const MAP_ROUTES = ["/map", "/population-map", "/facilities", "/settlements"];
// Docs and the learning hub render their own compact footer (see
// CompactFooter) — the full 4-column site footer is too tall next to their
// side navigation.
const OWN_FOOTER_ROUTES = ["/docs", "/learning"];

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapRoute = MAP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const hasOwnFooter = OWN_FOOTER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <>
      {children}
      {!isMapRoute && !hasOwnFooter && <Footer />}
    </>
  );
}
