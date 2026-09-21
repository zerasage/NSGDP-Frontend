import { cn } from "@/lib/utils";

type UserRole = 'viewer' | 'contributor' | 'data_manager' | 'admin';

const CONFIG: Record<UserRole, { label: string; className: string }> = {
  viewer:      { label: "Viewer",           className: "bg-secondary text-secondary-foreground" },
  contributor: { label: "Contributor",      className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  data_manager:{ label: "Data Manager",     className: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  admin:       { label: "Development Partner Admin", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
};

export function RoleBadge({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const config = CONFIG[role as UserRole] ?? CONFIG.viewer;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
