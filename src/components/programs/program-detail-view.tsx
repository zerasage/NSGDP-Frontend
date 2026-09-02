"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Target,
  TrendingUp,
  FileText,
  Download,
  Settings,
  Upload,
  ChevronRight,
  MoreHorizontal,
  ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel, MetricCard } from "@/components/dashboard/portal-dashboard-ui";
import {
  useProgramBySlug,
  useOrganizationProgram,
  useProgramReports,
} from "@/lib/hooks/usePrograms";
import { useDownloadDocument } from "@/lib/hooks/useDocuments";
import { useAuth } from "@/lib/auth";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { RichHtmlContent } from "@/components/programs/rich-html-content";
import { objectivesToEditorHtml } from "@/lib/api/programs";
import {
  PORTAL_PROGRAM_DETAIL_PAGE_TIP,
  PORTAL_PROGRAM_LGA_TIP,
  PORTAL_PROGRAM_PROGRESS_TIP,
  PORTAL_PROGRAM_REPORTS_TIP,
} from "@/lib/constants/portal-tooltips";
import {
  headlineProgressSummary,
  lgaCoverageCounts,
  lgaCoveragePercent,
  outcomeMetricPercent,
  tracksLgaCoverage,
  tracksOutcomeMetric,
  PROGRESS_MODE_OPTIONS,
} from "@/lib/constants/program-progress";
import { daysActiveSince, daysUntilStart } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ProgrammeStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize",
        status === "completed" && "border-0 bg-success/15 text-success",
        status === "ongoing" && "border-0 bg-info/15 text-info",
        status === "planned" && "border-0 bg-warning/15 text-amber-800 dark:text-warning",
      )}
    >
      {status}
    </Badge>
  );
}

interface ProgramDetailViewProps {
  slug: string;
  /** When true, loads via org-scoped API (dashboard /my-programs routes). */
  orgScope?: boolean;
}

export function ProgramDetailView({ slug, orgScope = false }: ProgramDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, can } = useProgramPermissions();
  const publicQuery = useProgramBySlug(orgScope ? "" : slug);
  const orgQuery = useOrganizationProgram(orgScope ? slug : "");
  const { data: program, isLoading, error } = orgScope ? orgQuery : publicQuery;
  const { data: reports } = useProgramReports(slug);
  const downloadMutation = useDownloadDocument();

  const handleDownloadReport = (reportSlug: string | undefined, title: string) => {
    if (!reportSlug) {
      toast.error("This report has no downloadable file yet");
      return;
    }
    downloadMutation.mutate(reportSlug, {
      onSuccess: (result) => {
        window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : `Failed to download "${title}"`);
      },
    });
  };

  if (isLoading) {
    return (
      <TooltipProvider delay={200}>
        <DashboardPage>
          <div className="border-b bg-background px-4 py-4 sm:px-6">
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="border-b bg-background px-4 py-5 sm:px-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
          <DashboardPageContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-48 rounded-2xl" />
          </DashboardPageContent>
        </DashboardPage>
      </TooltipProvider>
    );
  }

  if (error || !program) {
    const notFoundBackHref = orgScope ? "/my-programs" : "/programs";
    return (
      <DashboardPage>
        <DashboardPageContent className="py-16 text-center">
          <p className="text-muted-foreground">Programme not found.</p>
          <Link
            href={notFoundBackHref}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11")}
          >
            Back to programmes
          </Link>
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  const ownsProgramme =
    orgScope || (!!user?.organisationId && user.organisationId === program.organisationId);
  const canEdit = canAccess && ownsProgramme && can("edit");
  const canUploadReport = canAccess && ownsProgramme && can("upload");
  const hasManageActions = canEdit || canUploadReport;
  const backHref = ownsProgramme && canAccess ? "/my-programs" : "/programs";
  const backLabel = ownsProgramme && canAccess ? "Programmes" : "All programmes";

  const mode = program.progressMode ?? "lga_coverage";
  const lga = lgaCoverageCounts(program);
  const lgaPct = lgaCoveragePercent(program);
  const outcomePct = outcomeMetricPercent(program);
  const headline = headlineProgressSummary(program);
  const modeLabel = PROGRESS_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
  const untilStart = daysUntilStart(program.startDate);
  const activeDays = daysActiveSince(program.startDate);
  const timelineLabel = untilStart > 0 ? "Starts in (days)" : "Active days";
  const timelineValue = untilStart > 0 ? untilStart : activeDays;

  return (
    <TooltipProvider delay={200}>
      <DashboardPage>
        <div className="border-b bg-background px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
            {ownsProgramme && canAccess ? (
              <>
                <Link href="/dashboard" className="hover:text-foreground">
                  Dashboard
                </Link>
                <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
              </>
            ) : null}
            <Link href={backHref} className="hover:text-foreground">
              {backLabel}
            </Link>
            <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
            <span className="truncate text-foreground">{program.name}</span>
          </nav>
        </div>

        <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
          <div className="space-y-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ProgrammeStatusBadge status={program.status} />
                <Badge variant="outline" className="capitalize">
                  {program.type}
                </Badge>
                {program.organisationName ? (
                  <Badge variant="secondary">{program.organisationName}</Badge>
                ) : null}
              </div>
              <h1 className="mt-2 flex items-start gap-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                <span className="min-w-0">{program.name}</span>
                <HelpTip
                  content={PORTAL_PROGRAM_DETAIL_PAGE_TIP}
                  label="Programme detail help"
                  className="mt-0.5"
                />
              </h1>
              {program.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={backHref}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 gap-2 sm:h-9")}
              >
                <ArrowLeft className="size-4" />
                Back
              </Link>

              {canEdit ? (
                <Link
                  href={`/my-programs/${program.slug}/edit?progress=1`}
                  className={cn(buttonVariants({ size: "sm" }), "hidden h-10 gap-2 sm:inline-flex sm:h-9")}
                >
                  <TrendingUp className="size-4" />
                  Update progress
                </Link>
              ) : null}

              {canUploadReport ? (
                <Link
                  href={`/my-programs/${program.slug}/upload`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "hidden h-10 gap-2 sm:inline-flex sm:h-9",
                  )}
                >
                  <Upload className="size-4" />
                  Upload report
                </Link>
              ) : null}

              {canEdit ? (
                <Link
                  href={`/my-programs/${program.slug}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "hidden h-10 gap-2 sm:inline-flex sm:h-9",
                  )}
                >
                  <Settings className="size-4" />
                  Manage
                </Link>
              ) : null}

              {hasManageActions ? (
                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "size-10 px-0",
                      )}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">More actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {canEdit ? (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/my-programs/${program.slug}/edit?progress=1`)
                            }
                          >
                            <TrendingUp className="size-4" />
                            Update progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/my-programs/${program.slug}/edit`)}
                          >
                            <Settings className="size-4" />
                            Manage programme
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      {canUploadReport ? (
                        <DropdownMenuItem
                          onClick={() => router.push(`/my-programs/${program.slug}/upload`)}
                        >
                          <Upload className="size-4" />
                          Upload report
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}

              {canEdit ? (
                <Link
                  href={`/my-programs/${program.slug}/edit?progress=1`}
                  className={cn(buttonVariants({ size: "sm" }), "h-10 gap-2 sm:hidden")}
                >
                  <TrendingUp className="size-4" />
                  Update progress
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <DashboardPageContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {headline.percent != null ? (
              <MetricCard
                label="Progress"
                value={`${headline.percent}%`}
                hint={headline.basis ?? "Overall"}
                icon={TrendingUp}
                tone="primary"
              />
            ) : null}
            {tracksLgaCoverage(mode) && lga.target > 0 ? (
              <MetricCard
                label="LGA coverage"
                value={`${lga.reach}/${lga.target}`}
                hint="Areas reached"
                icon={MapPin}
                tone="success"
              />
            ) : null}
            {tracksOutcomeMetric(mode) && program.targetCount > 0 ? (
              <MetricCard
                label={program.primaryMetric || "Outcome"}
                value={`${program.reachCount.toLocaleString()}/${program.targetCount.toLocaleString()}`}
                hint="Target reached"
                icon={Target}
                tone="info"
              />
            ) : null}
            <MetricCard
              label={timelineLabel}
              value={timelineValue}
              hint={
                program.startDate
                  ? `From ${new Date(program.startDate).toLocaleDateString()}`
                  : undefined
              }
              icon={Calendar}
              tone="muted"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="space-y-4 lg:col-span-2 lg:space-y-6">
              <DashboardPanel
                title="Progress overview"
                titleTip={PORTAL_PROGRAM_PROGRESS_TIP}
                icon={TrendingUp}
                tone="primary"
                description={`Tracking mode: ${modeLabel}`}
              >
                <div className="space-y-5">
                  {tracksLgaCoverage(mode) && lgaPct != null ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">LGA coverage</span>
                        <span className="text-muted-foreground">
                          {lga.reach} / {lga.target} LGAs
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-muted sm:h-4">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${lgaPct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {tracksOutcomeMetric(mode) && outcomePct != null ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{program.primaryMetric || "Outcome"}</span>
                        <span className="text-muted-foreground">
                          {program.reachCount.toLocaleString()} /{" "}
                          {program.targetCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-muted sm:h-4">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${outcomePct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {headline.percent == null ? (
                    <p className="text-sm text-muted-foreground">No progress recorded yet.</p>
                  ) : null}
                </div>
              </DashboardPanel>

              {program.objectives?.length ? (
                <DashboardPanel title="Objectives" icon={ClipboardList} tone="muted">
                  <RichHtmlContent html={objectivesToEditorHtml(program.objectives)} />
                </DashboardPanel>
              ) : null}

              {(program.targetLgas?.length ?? 0) > 0 ? (
                <DashboardPanel
                  title={`Target LGAs (${program.targetLgas!.length})`}
                  titleTip={PORTAL_PROGRAM_LGA_TIP}
                  icon={MapPin}
                  tone="success"
                >
                  <div className="flex flex-wrap gap-2">
                    {program.targetLgas!.map((name) => (
                      <Badge
                        key={name}
                        variant={program.coveredLgas?.includes(name) ? "default" : "secondary"}
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </DashboardPanel>
              ) : null}
            </div>

            <div className="space-y-4 lg:space-y-6">
              <DashboardPanel
                title="Programme documents"
                titleTip={PORTAL_PROGRAM_REPORTS_TIP}
                icon={FileText}
                tone="info"
                action={
                  canUploadReport ? (
                    <Link
                      href={`/my-programs/${program.slug}/upload`}
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-9")}
                    >
                      <Upload className="size-4" />
                      Upload
                    </Link>
                  ) : undefined
                }
              >
                {reports?.length ? (
                  <ul className="space-y-2">
                    {reports.map((report) => (
                      <li
                        key={report.id}
                        className="flex items-center gap-3 rounded-xl border p-3"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{report.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.fileFormat} ·{" "}
                            {new Date(report.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-10 shrink-0 sm:size-9"
                          onClick={() => handleDownloadReport(report.slug, report.title)}
                          disabled={downloadMutation.isPending}
                          aria-label={`Download ${report.title}`}
                        >
                          <Download className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                )}
              </DashboardPanel>
            </div>
          </div>
        </DashboardPageContent>
      </DashboardPage>
    </TooltipProvider>
  );
}
