import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// Map backend roles to frontend roles for display
type BackendRole = 'viewer' | 'contributor' | 'data_manager' | 'admin';

const CONFIG: Record<UserRole | BackendRole, { label: string; className: string }> = {
  public:      { label: "Public",           className: "bg-muted text-muted-foreground" },
  registered:  { label: "Registered",       className: "bg-secondary text-secondary-foreground" },
  viewer:      { label: "Viewer",           className: "bg-secondary text-secondary-foreground" },
  contributor: { label: "Contributor",      className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  data_manager:{ label: "Data Manager",     className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  admin:       { label: "Org Admin",        className: "bg-info-100 text-info-800 dark:bg-info-950 dark:text-info-300" },
  staff:       { label: "Agency Staff",     className: "bg-primary/10 text-primary" },
  super_admin: { label: "Super Admin",      className: "bg-primary/10 text-primary" },
};

export function RoleBadge({
  role,
  className,
}: {
  role: UserRole | BackendRole;
  className?: string;
}) {
  const config = CONFIG[role] ?? CONFIG.registered;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
