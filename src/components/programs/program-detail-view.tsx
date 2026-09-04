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
  MoreHorizontal,
  ClipboardList,
  Tag,
  CheckCircle2,
  CircleDot,
  Circle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Container } from "@/components/layout/container";
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
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
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
import { typeChip } from "@/lib/constants/status-surfaces";
import {
  PORTAL_PROGRAM_DETAIL_PAGE_TIP,
  PORTAL_PROGRAM_LGA_TIP,
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
import type { ProgramStatus, ProgramType } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusIcon(status: ProgramStatus) {
  if (status === "completed") return <CheckCircle2 className="size-5 shrink-0 text-white/90" />;
  if (status === "ongoing")   return <CircleDot className="size-5 shrink-0 text-white/90" />;
  return <Circle className="size-5 shrink-0 text-white/70" />;
}

const TYPE_LABELS: Record<ProgramType, string> = {
  campaign:       "Campaign",
  surveillance:   "Surveillance",
  screening:      "Screening",
  training:       "Training",
  infrastructure: "Infrastructure",
  research:       "Research",
  other:          "Other",
};

const TYPE_COLORS: Record<ProgramType, string> = {
  campaign:       typeChip.blue,
  surveillance:   typeChip.purple,
  screening:      typeChip.teal,
  training:       typeChip.yellow,
  infrastructure: typeChip.orange,
  research:       typeChip.pink,
  other:          typeChip.gray,
};

function coverageBarColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
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
        <main className="flex-1">
          <section className="relative overflow-hidden border-b">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/90 via-primary to-primary/95" />
            <Container className="relative py-10 sm:py-16">
              <Skeleton className="h-12 w-3/4 bg-white/20" />
              <Skeleton className="mt-4 h-4 w-1/2 bg-white/15" />
            </Container>
          </section>
          <section className="py-8 sm:py-12">
            <Container size="wide">
              <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
                <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            </Container>
          </section>
        </main>
      </TooltipProvider>
    );
  }

  if (error || !program) {
    const notFoundBackHref = orgScope ? "/my-programs" : "/programs";
    return (
      <main className="flex flex-1 items-center justify-center py-16">
        <Container className="text-center">
          <p className="text-muted-foreground">Programme not found.</p>
          <Link
            href={notFoundBackHref}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11")}
          >
            Back to programmes
          </Link>
        </Container>
      </main>
    );
  }

  const ownsProgramme =
    orgScope || (!!user?.organisationId && user.organisationId === program.organisationId);
  const canEdit = canAccess && ownsProgramme && can("edit");
  const canUploadReport = canAccess && ownsProgramme && can("upload");
  const hasManageActions = canEdit || canUploadReport;
  const backHref = ownsProgramme && canAccess ? "/my-programs" : "/programs";

  const mode = program.progressMode ?? "lga_coverage";
  const lga = lgaCoverageCounts(program);
  const lgaPct = lgaCoveragePercent(program);
  const outcomePct = outcomeMetricPercent(program);
  const headline = headlineProgressSummary(program);
  const modeLabel = PROGRESS_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
  const untilStart = daysUntilStart(program.startDate);
  const activeDays = daysActiveSince(program.startDate);
  const timelineLabel = untilStart > 0 ? "Starts in" : "Active days";
  const timelineValue = untilStart > 0 ? untilStart : activeDays;

  return (
    <TooltipProvider delay={200}>
      <main className="flex-1">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/90 via-primary to-primary/95" />
          <Container className="relative py-10 sm:py-16">

            {/* Back button - outside main content */}
            <Link
              href={backHref}
              className="mb-6 inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to programmes
            </Link>

            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {statusIcon(program.status)}
                <div className="text-primary-foreground min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                        program.status === "completed" && "bg-emerald-400/30 text-white",
                        program.status === "ongoing" && "bg-amber-400/30 text-white",
                        program.status === "planned" && "bg-white/20 text-white/90",
                      )}
                    >
                      {program.status}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[program.type as ProgramType] || typeChip.gray}`}>
                      <Tag className="size-3" />
                      {TYPE_LABELS[program.type as ProgramType] || program.type}
                    </span>
                    {program.organisationName ? (
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white/90">
                        {program.organisationName}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="text-3xl font-bold sm:text-5xl flex items-start gap-2">
                    <span className="min-w-0">{program.name}</span>
                    <HelpTip
                      content={PORTAL_PROGRAM_DETAIL_PAGE_TIP}
                      label="Programme detail help"
                      className="mt-1"
                    />
                  </h1>
                  {program.description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-primary-foreground/90 sm:text-lg sm:mt-3">
                      {program.description}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Action buttons */}
              {hasManageActions && (
                <div className="flex flex-wrap items-center gap-2">
                  {canEdit ? (
                    <Link
                      href={`/my-programs/${program.slug}/edit?progress=1`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "hidden h-9 gap-2 bg-white/15 text-white hover:bg-white/25 sm:inline-flex"
                      )}
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
                        "hidden h-9 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 sm:inline-flex",
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
                        "hidden h-9 gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 sm:inline-flex",
                      )}
                    >
                      <Settings className="size-4" />
                      Manage
                    </Link>
                  ) : null}

                  {/* Mobile dropdown */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "size-9 border-white/20 bg-white/10 px-0 text-white hover:bg-white/20"
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
                </div>
              )}
            </div>

            {/* Summary stat chips — 2-col on mobile, 4-col on sm+ */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 max-w-4xl">
              {/* Progress */}
              {headline.percent != null && (
                <div className="rounded-lg bg-white/20 px-3 py-2.5 sm:px-4 sm:py-3 text-primary-foreground">
                  <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">{headline.percent}%</p>
                  <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">
                    {headline.basis || "Progress"}
                  </p>
                </div>
              )}

              {/* LGA Coverage */}
              {tracksLgaCoverage(mode) && lga.target > 0 && (
                <div className="rounded-lg bg-emerald-400/30 px-3 py-2.5 sm:px-4 sm:py-3 text-primary-foreground">
                  <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">
                    {lga.reach}/{lga.target}
                  </p>
                  <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">LGAs covered</p>
                </div>
              )}

              {/* Outcome metric */}
              {tracksOutcomeMetric(mode) && program.targetCount > 0 && (
                <div className="rounded-lg bg-white/20 px-3 py-2.5 sm:px-4 sm:py-3 text-primary-foreground">
                  <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">
                    {program.reachCount >= 1000
                      ? `${(program.reachCount / 1000).toFixed(0)}K`
                      : program.reachCount.toLocaleString()}
                    /
                    {program.targetCount >= 1000
                      ? `${(program.targetCount / 1000).toFixed(0)}K`
                      : program.targetCount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">
                    {program.primaryMetric || "Target"}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="rounded-lg bg-white/10 px-3 py-2.5 sm:px-4 sm:py-3 text-primary-foreground">
                <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">{timelineValue}</p>
                <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">{timelineLabel}</p>
              </div>
            </div>
          </Container>
        </section>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <section className="py-8 sm:py-12 lg:py-16">
          <Container size="wide">
            <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
              
              {/* Left column */}
              <div className="space-y-5 sm:space-y-6 lg:col-span-2">

                {/* Progress overview */}
                <div className="rounded-xl border bg-card">
                  <div className="border-b p-4 sm:p-6">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="size-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold">Progress overview</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Tracking mode: {modeLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6 space-y-5">
                    {tracksLgaCoverage(mode) && lgaPct != null ? (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium">LGA coverage</span>
                          <span className="text-muted-foreground">
                            {lga.reach} / {lga.target} LGAs
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${coverageBarColor(lgaPct)}`}
                            style={{ width: `${Math.max(lgaPct, lgaPct > 0 ? 2 : 0)}%` }}
                            role="progressbar"
                            aria-valuenow={lgaPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
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
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${coverageBarColor(outcomePct)}`}
                            style={{ width: `${Math.max(outcomePct, outcomePct > 0 ? 2 : 0)}%` }}
                            role="progressbar"
                            aria-valuenow={outcomePct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    ) : null}

                    {headline.percent == null ? (
                      <p className="text-sm text-muted-foreground">No progress recorded yet.</p>
                    ) : null}
                  </div>
                </div>

                {/* Objectives */}
                {program.objectives?.length ? (
                  <DashboardPanel title="Objectives" icon={ClipboardList} tone="muted">
                    <RichHtmlContent html={objectivesToEditorHtml(program.objectives)} />
                  </DashboardPanel>
                ) : null}

                {/* Target LGAs */}
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

              {/* Right column - Documents */}
              <div>
                <div className="rounded-xl border bg-card">
                  <div className="border-b p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <FileText className="size-5 shrink-0 text-info" />
                        <div>
                          <h2 className="text-lg font-semibold flex items-center gap-1.5">
                            Programme documents
                            <HelpTip content={PORTAL_PROGRAM_REPORTS_TIP} label="Reports help" />
                          </h2>
                        </div>
                      </div>
                      {canUploadReport ? (
                        <Link
                          href={`/my-programs/${program.slug}/upload`}
                          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-9 gap-2")}
                        >
                          <Upload className="size-4" />
                          Upload
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {reports?.length ? (
                      <ul className="space-y-2">
                        {reports.map((report) => (
                          <li
                            key={report.id}
                            className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2 xs:flex-row xs:items-center xs:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug">{report.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {report.fileFormat} · {formatDate(report.uploadedAt.split("T")[0])}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full xs:w-auto gap-1.5"
                              onClick={() => handleDownloadReport(report.slug, report.title)}
                              disabled={downloadMutation.isPending}
                            >
                              <Download className="size-4" />
                              Download
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No documents uploaded yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </TooltipProvider>
  );
}
