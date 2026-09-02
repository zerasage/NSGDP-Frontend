"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import {
  DashboardSidebar,
  DashboardMobileSidebar,
} from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, isOrgMember } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // staff/super_admin are admin-portal-only principals — they have no
  // organisation-scoped functionality here. The backend already rejects
  // their login at /auth/login; this covers stale sessions from before that
  // guard existed, or tokens issued directly against the admin-auth system.
  const isAdminPortalOnly = user?.role === "staff" || user?.role === "super_admin";

  // Auth guard - redirect to login if not authenticated, or to the admin
  // portal if authenticated as a principal that doesn't belong here
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const returnTo =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/dashboard";
      router.push(`/login?returnTo=${encodeURIComponent(returnTo || "/dashboard")}`);
      return;
    }
    if (isAdminPortalOnly) {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3003";
      window.location.href = `${adminUrl}/login`;
    }
  }, [isAuthenticated, isLoading, isAdminPortalOnly, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated, or if this account belongs
  // to the admin portal instead (redirect is in flight)
  if (!isAuthenticated || isAdminPortalOnly) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar - Fixed */}
        <DashboardSidebar className="hidden lg:flex" />

        {/* Mobile Sidebar */}
        <DashboardMobileSidebar
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        {/* Main Content - Scrollable */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="sticky top-0 z-30 border-b bg-background/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
            <Button
              variant="outline"
              onClick={() => setMobileOpen(true)}
              className="h-11 w-full justify-between gap-3 rounded-xl px-4 text-sm font-medium"
            >
              <span className="flex items-center gap-2.5">
                <Menu className="size-5 shrink-0" />
                <span className="truncate">
                  {user?.organisationName && isOrgMember(user?.role)
                    ? user.organisationName
                    : "Open menu"}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">Menu</span>
            </Button>
          </div>

          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </div>
      </div>
    </div>
  );
}
