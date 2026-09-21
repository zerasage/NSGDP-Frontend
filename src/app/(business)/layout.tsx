import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { BusinessShell } from "@/components/layout/business-shell";
import { BRAND } from "@/lib/constants/brand";

export const metadata: Metadata = {
  title: {
    template: `%s | ${BRAND.portalName}`,
    default: BRAND.portalName,
  },
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <BusinessShell>{children}</BusinessShell>
    </>
  );
}
