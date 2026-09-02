"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Database,
  Download,
  Bell,
  Building2,
  User,
  X,
  Upload,
  ClipboardList,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuth, canAccessPrograms } from "@/lib/auth";
import { isOrgMember } from "@/lib/auth/portal-access";
import type { UserProfile } from "@/lib/types/auth";

type SidebarVariant = "desktop" | "mobile";

interface NavLink {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  requiresOrgCapability?: string;
  requiresProgramAccess?: boolean;
  section?: "main" | "workspace" | "account";
}

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "main" },
  {
    href: "/datasets",
    label: "Datasets",
    icon: Database,
    roles: ["contributor", "admin"],
    section: "workspace",
  },
  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: FileText,
    roles: ["contributor", "admin"],
    section: "workspace",
  },
  {
    href: "/my-programs",
    label: "Programmes",
    icon: ClipboardList,
    roles: ["contributor", "admin"],
    requiresProgramAccess: true,
    section: "workspace",
  },
  {
    href: "/organisation",
    label: "Organization",
    icon: Building2,
    roles: ["contributor", "admin"],
    section: "workspace",
  },
  { href: "/downloads", label: "Downloads", icon: Download, section: "account" },
  { href: "/notifications", label: "Notifications", icon: Bell, section: "account" },
  { href: "/profile", label: "Profile", icon: User, section: "account" },
];

function getVisibleNavLinks(links: NavLink[], user: UserProfile | null | undefined): NavLink[] {
  return links.filter((link) => {
    if (!link.roles) return true;
    if (!user) return false;
    if (!link.roles.includes(user.role)) return false;
    if (link.requiresProgramAccess) {
      return canAccessPrograms(user.role, user.organisationCapabilities);
    }
    if (link.requiresOrgCapability) {
      return (user.organisationCapabilities ?? []).includes(link.requiresOrgCapability);
    }
    return true;
  });
}

function isNavActive(pathname: string | null, href: string) {
  return pathname === href || (href !== "/dashboard" && !!pathname?.startsWith(href));
}

function SidebarOrgBadge({ name, variant }: { name: string; variant: SidebarVariant }) {
  const isMobile = variant === "mobile";
  return (
    <div className={cn("shrink-0 border-b", isMobile ? "px-4 py-3" : "px-3 py-2.5")}>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl bg-primary text-primary-foreground",
          isMobile ? "px-3 py-2.5" : "px-3 py-2",
        )}
      >
        <Building2 className="size-4 shrink-0 opacity-90" aria-hidden />
        <p className="truncate text-xs font-semibold sm:text-sm">{name}</p>
      </div>
    </div>
  );
}

function SidebarNavItem({
  link,
  isActive,
  onNavigate,
  variant,
}: {
  link: NavLink;
  isActive: boolean;
  onNavigate?: () => void;
  variant: SidebarVariant;
}) {
  const Icon = link.icon;
  const isMobile = variant === "mobile";

  return (
    <Link href={link.href} onClick={onNavigate} className="block">
      <span
        className={cn(
          "flex items-center gap-3 rounded-xl font-medium transition-colors",
          isMobile ? "min-h-11 px-3 py-2.5 text-sm" : "h-10 px-3 text-sm",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg border",
            isMobile ? "size-9" : "size-8",
            isActive
              ? "border-primary/20 bg-primary/10"
              : "border-transparent bg-muted/50",
          )}
        >
          <Icon className={cn("size-[18px]", isActive ? "text-primary" : "text-muted-foreground")} />
        </span>
        <span className="truncate">{link.label}</span>
      </span>
    </Link>
  );
}

function SidebarUserFooter({ user, variant }: { user: UserProfile; variant: SidebarVariant }) {
  const isMobile = variant === "mobile";
  return (
    <div className={cn("shrink-0 border-t bg-background", isMobile ? "px-4 py-3" : "px-3 py-2.5")}>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-muted/20",
          isMobile ? "p-3" : "p-2.5",
        )}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          {user.firstName?.[0]}
          {user.lastName?.[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
          <RoleBadge role={user.role} className="mt-1" />
        </div>
      </div>
    </div>
  );
}

function SidebarNavContent({
  pathname,
  user,
  onNavigate,
  variant,
}: {
  pathname: string | null;
  user: UserProfile | null | undefined;
  onNavigate?: () => void;
  variant: SidebarVariant;
}) {
  const router = useRouter();
  const visibleLinks = getVisibleNavLinks(NAV_LINKS, user);
  const canUpload = user && isOrgMember(user.role);
  const isMobile = variant === "mobile";

  const mainLinks = visibleLinks.filter((l) => (l.section ?? "main") === "main");
  const workspaceLinks = visibleLinks.filter((l) => l.section === "workspace");
  const accountLinks = visibleLinks.filter((l) => l.section === "account");

  return (
    <>
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col px-2 py-2",
          isMobile ? "overflow-y-auto overscroll-contain" : "overflow-hidden justify-between",
        )}
      >
        <div className="space-y-1">
          {mainLinks.map((link) => (
            <SidebarNavItem
              key={link.href}
              link={link}
              isActive={isNavActive(pathname, link.href)}
              onNavigate={onNavigate}
              variant={variant}
            />
          ))}

          {workspaceLinks.length > 0 ? (
            <>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Workspace
              </p>
              {workspaceLinks.map((link) => (
                <SidebarNavItem
                  key={link.href}
                  link={link}
                  isActive={isNavActive(pathname, link.href)}
                  onNavigate={onNavigate}
                  variant={variant}
                />
              ))}
            </>
          ) : null}

          {accountLinks.length > 0 ? (
            <>
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account
              </p>
              {accountLinks.map((link) => (
                <SidebarNavItem
                  key={link.href}
                  link={link}
                  isActive={isNavActive(pathname, link.href)}
                  onNavigate={onNavigate}
                  variant={variant}
                />
              ))}
            </>
          ) : null}
        </div>

        {canUpload ? (
          <div className={cn("shrink-0", isMobile ? "sticky bottom-0 bg-background pt-3 pb-1" : "pt-2")}>
            <Button
              className={cn(
                "w-full gap-2 rounded-xl shadow-sm",
                isMobile ? "h-11 text-sm" : "h-10 text-sm",
              )}
              onClick={() => {
                router.push("/upload");
                onNavigate?.();
              }}
            >
              <Upload className="size-4" />
              Upload dataset
            </Button>
          </div>
        ) : null}
      </nav>

      {user ? <SidebarUserFooter user={user} variant={variant} /> : null}
    </>
  );
}

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-64 shrink-0 flex-col border-r bg-background",
        className,
      )}
    >
      {user?.organisationName && isOrgMember(user.role) ? (
        <SidebarOrgBadge name={user.organisationName} variant="desktop" />
      ) : null}
      <SidebarNavContent pathname={pathname} user={user} variant="desktop" />
    </aside>
  );
}

interface DashboardMobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardMobileSidebar({ open, onClose }: DashboardMobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "relative flex h-full w-[min(100vw-3rem,20rem)] max-w-[20rem] flex-col",
          "overflow-hidden bg-background shadow-2xl",
          "animate-in slide-in-from-left-4 duration-200",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Navigation
            </p>
            <h2 className="truncate text-base font-semibold">Dashboard</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl border hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {user?.organisationName && isOrgMember(user.role) ? (
          <SidebarOrgBadge name={user.organisationName} variant="mobile" />
        ) : null}

        <SidebarNavContent
          pathname={pathname}
          user={user}
          onNavigate={onClose}
          variant="mobile"
        />
      </aside>
    </div>
  );
}
