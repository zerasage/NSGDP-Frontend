"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel, EmptyPanelState } from "@/components/dashboard/portal-dashboard-ui";
import { ProgramForm, programToFormDefaults } from "@/components/programs/program-form";
import { ProgramProgressPanel } from "@/components/programs/program-progress-panel";
import { useOrganizationProgram, useUpdateProgram, useDeleteProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import {
  PORTAL_PROGRAM_PROGRESS_TIP,
  PORTAL_PROGRAM_CREATE_TIP,
} from "@/lib/constants/portal-tooltips";
import type { ProgramFormData } from "@/lib/schemas/program";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EditProgrammePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const progressOnly = searchParams.get("progress") === "1";
  const { can, canDelete, canAccess } = useProgramPermissions();
  const { data: programme, isLoading, error } = useOrganizationProgram(slug);
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
        <DashboardPageContent className="mx-auto max-w-3xl">
          <Skeleton className="h-96 rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (!canAccess || !can("edit")) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={ClipboardList}
            message={
              !canAccess
                ? "Your organisation does not have permission to manage programmes."
                : "You do not have permission to edit programmes."
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

  if (error || !programme) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={ClipboardList}
            message="Programme not found, or it doesn't belong to your organisation."
            action={
              <Link href="/my-programs" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
                Back to programmes
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  const programmeHref = `/my-programs/${programme.slug}`;
  const progressHref = `${programmeHref}/edit?progress=1`;
  const manageHref = `${programmeHref}/edit`;
  const isBusy = updateMutation.isPending || isRedirecting;

  const handleDetailsSubmit = async (data: ProgramFormData) => {
    try {
      await updateMutation.mutateAsync({ slug: programme.slug, data });
      toast.success("Programme updated");
      setIsRedirecting(true);
      router.push(programmeHref);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update programme");
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (!window.confirm(`Archive "${programme.name}"? This can be reversed by an administrator.`)) {
      return;
    }
    deleteMutation.mutate(programme.slug, {
      onSuccess: () => {
        toast.success("Programme archived");
        router.push("/my-programs");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to archive programme");
      },
    });
  };

  const pageTitle = progressOnly ? "Update progress" : "Manage programme";
  const pageDescription = progressOnly
    ? "Update LGA coverage, outcome counts, or status — programme details are not changed here."
    : "Edit name, dates, target LGAs, and tracking settings for this programme.";
  const pageTip = progressOnly ? PORTAL_PROGRAM_PROGRESS_TIP : PORTAL_PROGRAM_CREATE_TIP;
  const badgeLabel = progressOnly ? "Progress update" : "Programme settings";
  const BadgeIcon = progressOnly ? TrendingUp : Settings;
  const badgeTone = progressOnly ? "primary" : "success";

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href="/my-programs" className="hover:text-foreground">
            Programmes
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href={programmeHref} className="truncate hover:text-foreground">
            {programme.name}
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <span className="text-foreground">{progressOnly ? "Update progress" : "Manage"}</span>
        </nav>
      </div>

      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={programmeHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-4 h-10 w-fit gap-2 px-0 hover:bg-transparent",
              )}
            >
              <ArrowLeft className="size-4" />
              Back to programme
            </Link>
            <div
              className={cn(
                "mb-2 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1",
                badgeTone === "primary"
                  ? "border-primary/25 bg-primary/[0.06]"
                  : "border-success/25 bg-success/[0.06]",
              )}
            >
              <BadgeIcon
                className={cn(
                  "size-3.5",
                  badgeTone === "primary" ? "text-primary" : "text-success",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wide",
                  badgeTone === "primary" ? "text-primary" : "text-success",
                )}
              >
                {badgeLabel}
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              {pageTitle}
              <HelpTip content={pageTip} label={`${pageTitle} help`} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pageDescription}{" "}
              <span className="font-medium text-foreground">{programme.name}</span>
            </p>
          </div>

          {!progressOnly && canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              className="h-10 shrink-0 sm:h-9"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Archive
            </Button>
          ) : null}
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl space-y-4">
        {progressOnly ? (
          <DashboardPanel
            title="Progress"
            description="Changes here update coverage, reach counts, and status only."
            icon={TrendingUp}
            tone="primary"
          >
            <ProgramProgressPanel
              programme={programme}
              embedded
              onSuccess={() => {
                setIsRedirecting(true);
                router.push(programmeHref);
              }}
            />
          </DashboardPanel>
        ) : (
          <>
            <DashboardPanel
              title="Quick action"
              description="Rollout and outcome metrics are updated separately from programme settings."
              icon={TrendingUp}
              tone="info"
              action={
                <Link
                  href={progressHref}
                  className={cn(buttonVariants({ size: "sm" }), "h-9 gap-2")}
                >
                  <TrendingUp className="size-4" />
                  Update progress
                </Link>
              }
            >
              <p className="text-sm text-muted-foreground">
                Use progress update to mark covered LGAs, record outcome reach, or change active /
                completed status without editing programme details.
              </p>
            </DashboardPanel>

            <DashboardPanel
              title="Programme details"
              description="Name, schedule, target LGAs, objectives, and tracking mode."
              icon={Settings}
              tone="success"
            >
              <ProgramForm
                defaultValues={programToFormDefaults(programme)}
                onSubmit={handleDetailsSubmit}
                submitLabel="Save changes"
                submittingLabel="Saving changes…"
                disabled={isBusy}
                isSubmitting={isBusy}
                isEditing
              />
            </DashboardPanel>
          </>
        )}

        {progressOnly ? (
          <p className="text-center text-sm text-muted-foreground">
            Need to change programme details?{" "}
            <Link href={manageHref} className="font-medium text-primary hover:underline">
              Manage programme
            </Link>
          </p>
        ) : null}
      </DashboardPageContent>
    </DashboardPage>
  );
}
