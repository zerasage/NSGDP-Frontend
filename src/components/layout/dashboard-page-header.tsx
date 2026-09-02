import { cn } from "@/lib/utils";

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DashboardPageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div className={cn("border-b bg-background px-6 py-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

interface DashboardPageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardPageContent({ children, className }: DashboardPageContentProps) {
  return <div className={cn("p-4 sm:p-6", className)}>{children}</div>;
}

interface DashboardPageProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardPage({ children, className }: DashboardPageProps) {
  return <main className={cn("flex-1 bg-muted/40", className)}>{children}</main>;
}
