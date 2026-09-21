"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

const MAP_ROUTES = ["/map", "/population-map", "/facilities", "/settlements"];

export function BusinessShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMapRoute = MAP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return (
    <>
      {children}
      {!isMapRoute && <Footer />}
    </>
  );
}
