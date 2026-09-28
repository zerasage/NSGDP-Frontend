import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { PageEyebrow } from "@/components/layout/content-panel";
import { DashboardPage, DashboardPageContent } from "@/components/layout/dashboard-page-header";

export type LearningVariant = "portal" | "dashboard";

export const LEARNING_BASE_PATH: Record<LearningVariant, string> = {
  portal: "/learning",
  dashboard: "/dashboard/learning",
};

/**
 * Wraps the learning hub and guide pages for either surface: the public portal
 * shell (Navbar/Footer come from the route group) or the contributor dashboard.
 */
export function LearningShell({
  variant,
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions,
  children,
}: {
  variant: LearningVariant;
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  if (variant === "dashboard") {
    const Icon = eyebrowIcon;
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-1">
                <Icon className="size-3.5 text-primary" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                  {eyebrow}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </div>
        <DashboardPageContent className="space-y-4 sm:space-y-6">{children}</DashboardPageContent>
      </DashboardPage>
    );
  }

  return (
    <main className="flex-1 py-6">
      <Container size="wide" className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <PageEyebrow label={eyebrow} icon={eyebrowIcon} />
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
        {children}
      </Container>
    </main>
  );
}
