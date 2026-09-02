"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Search,
  Upload,
  TrendingUp,
  RotateCcw,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganizationPrograms, useDeleteProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import {
  DashboardPanel,
  EmptyPanelState,
  FilterChip,
  MetricCard,
} from "@/components/dashboard/portal-dashboard-ui";
import { HelpTip } from "@/components/ui/help-tip";
import {
  PORTAL_PROGRAMS_ACTIVE_METRIC_TIP,
  PORTAL_PROGRAMS_PAGE_TIP,
  PORTAL_PROGRAMS_STATUS_TIP,
} from "@/lib/constants/portal-tooltips";
import { formatDate } from "@/lib/utils/date";
import { headlineProgressSummary, lgaCoverageCounts } from "@/lib/constants/program-progress";
import type { Program } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RawStatus = "active" | "completed" | "suspended" | "archived";

const statusFilters: { value: RawStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

function ProgrammeStatusBadge({ status }: { status: RawStatus | undefined }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="border-0 bg-success/15 text-success">Completed</Badge>
      );
    case "suspended":
      return (
        <Badge className="border-0 bg-warning/15 text-amber-800 dark:text-warning">
          Suspended
        </Badge>
      );
    case "archived":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Archived
        </Badge>
      );
    default:
      return <Badge className="border-0 bg-info/15 text-info">Active</Badge>;
  }
}

export default function MyProgrammesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();
  const { canAccess, canCreate, canUpload, canDelete, can } = useProgramPermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RawStatus | "all">(
    (searchParams?.get("status") as RawStatus) || "all",
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<{ slug: string; name: string } | null>(
    null,
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOrganizationPrograms(
    {
      page: 1,
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      q: searchQuery || undefined,
    },
    { enabled: !!user?.id && canAccess },
  );

  const { data: countsData } = useOrganizationPrograms(
    { page: 1, limit: 100 },
    { enabled: !!user?.id && canAccess },
  );

  const deleteMutation = useDeleteProgram();
  const programmes = data?.data ?? [];
  const meta = data?.meta;
  const allForCounts = countsData?.data ?? [];

  const canEdit = can("edit");
  const canUploadReport = canUpload;
  const showRowActions = canUploadReport || canEdit || canDelete;

  if (authLoading || !allowed) {
    return null;
  }

  const statusCounts: Record<RawStatus | "all", number> = {
    all: allForCounts.length,
    active: allForCounts.filter((p) => p.rawStatus === "active").length,
    completed: allForCounts.filter((p) => p.rawStatus === "completed").length,
    suspended: allForCounts.filter((p) => p.rawStatus === "suspended").length,
    archived: allForCounts.filter((p) => p.rawStatus === "archived").length,
  };

  const handleDelete = (slug: string, name: string) => {
    setSelectedProgramme({ slug, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedProgramme) return;
    deleteMutation.mutate(selectedProgramme.slug, {
      onSuccess: () => {
        toast.success("Programme archived");
        setSelectedProgramme(null);
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to archive programme");
      },
    });
  };

  if (!canAccess) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={ClipboardList}
            message="Your organisation has not been granted programme access. Contact a super administrator to request it via an Organisation Group."
            action={
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
                Back to dashboard
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
              <ClipboardList className="size-3.5 text-success" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                Organisation
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Programmes
              <HelpTip content={PORTAL_PROGRAMS_PAGE_TIP} label="Programmes page help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {canCreate
                ? "Manage your organisation's programmes and track rollout progress."
                : "Upload reports and view progress for your organisation's programmes."}
            </p>
          </div>
          {canCreate ? (
            <Link
              href="/my-programs/new"
              className={cn(buttonVariants(), "h-11 shrink-0 gap-2 sm:h-10")}
            >
              <Plus className="size-4" />
              Create programme
            </Link>
          ) : null}
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total"
            value={statusCounts.all}
            hint="All organisation programmes"
            icon={ClipboardList}
            tone="success"
          />
          <MetricCard
            label="Active"
            value={statusCounts.active}
            hint="Currently running"
            icon={TrendingUp}
            tone="info"
            tip={PORTAL_PROGRAMS_ACTIVE_METRIC_TIP}
            onClick={() => setStatusFilter("active")}
          />
          <MetricCard
            label="Completed"
            value={statusCounts.completed}
            hint="Finished programmes"
            icon={CheckCircle2}
            tone="primary"
            onClick={() => setStatusFilter("completed")}
          />
          <MetricCard
            label="Suspended"
            value={statusCounts.suspended}
            hint="Paused by admins"
            icon={PauseCircle}
            tone="warning"
            onClick={() => setStatusFilter("suspended")}
          />
        </div>

        <DashboardPanel
          title="Your programmes"
          titleTip={PORTAL_PROGRAMS_STATUS_TIP}
          description="Filter by status or search by name and description."
          icon={ClipboardList}
          tone="success"
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RotateCcw className={cn("size-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {statusFilters.map((filter) => (
                <FilterChip
                  key={filter.value}
                  active={statusFilter === filter.value}
                  label={filter.label}
                  count={statusCounts[filter.value]}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search programmes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10"
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl sm:h-20" />
                ))}
              </div>
            ) : error ? (
              <EmptyPanelState
                icon={ClipboardList}
                message="Failed to load programmes."
                action={
                  <Button variant="outline" className="h-11" onClick={() => void refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : !user?.organisationId ? (
              <EmptyPanelState
                icon={ClipboardList}
                message="Your account isn't linked to an organisation yet, so there are no programmes to manage here."
              />
            ) : programmes.length === 0 ? (
              <EmptyPanelState
                icon={ClipboardList}
                message={
                  searchQuery
                    ? "No programmes match your search."
                    : canCreate
                      ? "No programmes yet — create your first one to get started."
                      : "No programmes match your filters yet."
                }
                action={
                  searchQuery || !canCreate ? undefined : (
                    <Link href="/my-programs/new" className={cn(buttonVariants(), "h-11")}>
                      <Plus className="size-4" />
                      Create programme
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <ul className="space-y-3 lg:hidden">
                  {programmes.map((programme) => (
                    <ProgrammeMobileCard
                      key={programme.id}
                      programme={programme}
                      showActions={showRowActions}
                      canUpload={canUploadReport}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onDelete={() => handleDelete(programme.slug, programme.name)}
                    />
                  ))}
                </ul>

                <div className="hidden overflow-hidden rounded-xl border lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/30">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Programme</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Type</th>
                          <th className="px-4 py-3 text-left font-medium">Progress</th>
                          <th className="px-4 py-3 text-left font-medium">LGAs</th>
                          <th className="px-4 py-3 text-left font-medium">Updated</th>
                          {showRowActions ? (
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {programmes.map((programme) => {
                          const progress = headlineProgressSummary(programme);
                          const lga = lgaCoverageCounts(programme);
                          return (
                            <tr key={programme.id} className="hover:bg-muted/30">
                              <td className="px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <ClipboardList className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <Link
                                      href={`/my-programs/${programme.slug}`}
                                      className="font-medium hover:text-primary"
                                    >
                                      {programme.name}
                                    </Link>
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                      {programme.targetLgas?.length ?? 0} target LGAs
                                      {programme.description ? ` · ${programme.description}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <ProgrammeStatusBadge status={programme.rawStatus} />
                              </td>
                              <td className="px-4 py-3 capitalize text-muted-foreground">
                                {programme.type}
                              </td>
                              <td className="px-4 py-3">
                                {progress.percent !== null ? (
                                  <div>
                                    <span className="font-medium tabular-nums">
                                      {progress.percent}%
                                    </span>
                                    {progress.basis ? (
                                      <p className="line-clamp-1 text-xs text-muted-foreground">
                                        {progress.basis}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                {lga.target > 0 ? `${lga.reach} / ${lga.target}` : "—"}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {programme.updatedAt ? formatDate(programme.updatedAt) : "—"}
                              </td>
                              {showRowActions ? (
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <Link href={`/my-programs/${programme.slug}`}>
                                      <Button size="icon" variant="ghost" className="size-9">
                                        <Eye className="size-4" />
                                      </Button>
                                    </Link>
                                    {canUploadReport ? (
                                      <Link href={`/my-programs/${programme.slug}/upload`}>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="size-9"
                                          title="Upload report"
                                        >
                                          <Upload className="size-4" />
                                        </Button>
                                      </Link>
                                    ) : null}
                                    {canEdit ? (
                                      <>
                                        <Link
                                          href={`/my-programs/${programme.slug}/edit?progress=1`}
                                        >
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="size-9"
                                            title="Update progress"
                                          >
                                            <TrendingUp className="size-4" />
                                          </Button>
                                        </Link>
                                        <Link href={`/my-programs/${programme.slug}/edit`}>
                                          <Button size="icon" variant="ghost" className="size-9">
                                            <Edit className="size-4" />
                                          </Button>
                                        </Link>
                                      </>
                                    ) : null}
                                    {canDelete ? (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-9 text-destructive hover:text-destructive"
                                        onClick={() =>
                                          handleDelete(programme.slug, programme.name)
                                        }
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="size-4" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </td>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Showing {programmes.length} of {meta?.total ?? programmes.length} programmes
                </p>
              </>
            )}
          </div>
        </DashboardPanel>
      </DashboardPageContent>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive programme"
        description={`Are you sure you want to archive "${selectedProgramme?.name}"? This can be reversed by an administrator.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </DashboardPage>
  );
}

function ProgrammeMobileCard({
  programme,
  showActions,
  canUpload,
  canEdit,
  canDelete,
  onDelete,
}: {
  programme: Program;
  showActions: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const router = useRouter();
  const progress = headlineProgressSummary(programme);
  const lga = lgaCoverageCounts(programme);

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <ClipboardList className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/my-programs/${programme.slug}`}
              className="font-medium leading-snug hover:text-primary"
            >
              {programme.name}
            </Link>
            {showActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-muted"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.push(`/my-programs/${programme.slug}`)}
                  >
                    <Eye className="size-4" />
                    View
                  </DropdownMenuItem>
                  {canUpload ? (
                    <DropdownMenuItem
                      onClick={() => router.push(`/my-programs/${programme.slug}/upload`)}
                    >
                      <Upload className="size-4" />
                      Upload report
                    </DropdownMenuItem>
                  ) : null}
                  {canEdit ? (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/my-programs/${programme.slug}/edit?progress=1`)
                        }
                      >
                        <TrendingUp className="size-4" />
                        Update progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/my-programs/${programme.slug}/edit`)}
                      >
                        <Edit className="size-4" />
                        Edit programme
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={onDelete}>
                        <Trash2 className="size-4" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {programme.targetLgas?.length ?? 0} target LGAs
            {programme.description ? ` · ${programme.description}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ProgrammeStatusBadge status={programme.rawStatus} />
            <Badge variant="outline" className="capitalize">
              {programme.type}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            {progress.percent !== null ? (
              <span>
                Progress {progress.percent}%
                {progress.basis ? ` · ${progress.basis}` : ""}
              </span>
            ) : null}
            {lga.target > 0 ? (
              <span>
                LGAs {lga.reach}/{lga.target}
              </span>
            ) : null}
            {programme.updatedAt ? (
              <span>Updated {formatDate(programme.updatedAt)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
