"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Map,
  Database,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { NotificationBell } from "@/components/layout/notification-bell";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/analytics", label: "Analytics Dashboard" },
  { href: "/programs", label: "Programs" },
  // Deferred to a later version — page kept at /learning
  // { href: "/learning", label: "Tools & Learning" },
];

const DATA_PORTAL_LINKS = [
  { href: "/dataportal", label: "Browse Datasets", icon: Database },
  { href: "/documents", label: "Document Library", icon: Database },
  // Public contribute entry — upload wizard stays in the signed-in dashboard only
  { href: "/partner-data", label: "Contribute Data", icon: Handshake },
];

const GIS_LINKS = [
  { href: "/map", label: "Dataset Coverage Map", icon: Map },
  { href: "/population-map", label: "Population & Facility Map", icon: Map },
  { href: "/facilities", label: "Facility Finder", icon: Map },
  { href: "/settlements", label: "Settlement Access Map", icon: Map },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
    setMobileOpen(false);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="navbar sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
          <GeoHealthLogo />

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("text-sm", isActive(link.href) && "bg-muted font-semibold")}
                >
                  {link.label}
                </Button>
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                Explore Data
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {DATA_PORTAL_LINKS.map((l) => (
                  <DropdownMenuItem key={l.href} onClick={() => router.push(l.href)}>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                GIS Mapping
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {GIS_LINKS.map((l) => (
                  <DropdownMenuItem key={l.href} onClick={() => router.push(l.href)}>
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />

            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {!isAuthenticated ? (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">Log In</Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted"
                  aria-label="User menu"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || "U"}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{user?.firstName} {user?.lastName}</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="size-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                      <Settings className="size-4" /> Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden ml-1 flex size-9 items-center justify-center rounded-md hover:bg-muted"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <nav
            className="relative ml-auto flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-background shadow-xl"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b px-4 py-4">
              <GeoHealthLogo compact />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col gap-0.5 p-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                    isActive(link.href) && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 border-t pt-2">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Explore Data
                </p>
                {DATA_PORTAL_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                      isActive(l.href) && "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <l.icon className="size-4 text-muted-foreground" />
                    {l.label}
                  </Link>
                ))}
              </div>

              <div className="mt-2 border-t pt-2">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  GIS Mapping
                </p>
                {GIS_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                      isActive(l.href) && "bg-primary/10 text-primary font-semibold"
                    )}
                  >
                    <l.icon className="size-4 text-muted-foreground" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile auth */}
            <div className="mt-auto border-t p-4 space-y-2">
              {!isAuthenticated ? (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                    <Button variant="outline" className="w-full">Log In</Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 font-semibold">
                      Sign Up
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="truncate text-xs text-muted-foreground capitalize">{user?.role.replace("_", " ") || ""}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <LayoutDashboard className="size-4" /> Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" /> Log Out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
