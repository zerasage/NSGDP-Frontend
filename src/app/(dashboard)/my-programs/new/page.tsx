"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { ProgramForm } from "@/components/programs/program-form";
import { useCreateProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { useAuth } from "@/lib/auth";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel, EmptyPanelState } from "@/components/dashboard/portal-dashboard-ui";
import { PORTAL_PROGRAM_CREATE_TIP } from "@/lib/constants/portal-tooltips";
import type { ProgramFormData } from "@/lib/schemas/program";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewProgrammePage() {
  const router = useRouter();
  const { canAccess, canCreate } = useProgramPermissions();
  const { user, isLoading } = useAuth();
  const createMutation = useCreateProgram();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isBusy = createMutation.isPending || isRedirecting;

  if (isLoading || !user) {
    return null;
  }

  if (!canAccess || !canCreate) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={ClipboardList}
            message={
              !canAccess
                ? "Your organisation does not have permission to manage programmes."
                : "You do not have permission to create programmes. Contact your organisation admin."
            }
            action={
              <Link
                href={canAccess ? "/my-programs" : "/dashboard"}
                className={cn(buttonVariants({ variant: "outline" }), "h-11")}
              >
                {canAccess ? "Back to programmes" : "Back to dashboard"}
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      const programme = await createMutation.mutateAsync(data);
      toast.success(`Programme "${programme.name}" created`);
      setIsRedirecting(true);
      router.push(`/my-programs/${programme.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create programme");
    }
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/my-programs"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-fit gap-2 px-0 hover:bg-transparent",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to programmes
          </Link>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
              <ClipboardList className="size-3.5 text-success" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                New programme
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Create programme
              <HelpTip content={PORTAL_PROGRAM_CREATE_TIP} label="Create programme help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Register a health programme for {user.organisationName ?? "your organisation"}.
            </p>
          </div>
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl">
        <DashboardPanel
          title="Programme details"
          description="Set the basics now — add progress updates and reports after saving."
          icon={Plus}
          tone="success"
        >
          <ProgramForm
            onSubmit={handleSubmit}
            submitLabel="Create programme"
            submittingLabel="Creating programme…"
            disabled={isBusy}
            isSubmitting={isBusy}
          />
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}
