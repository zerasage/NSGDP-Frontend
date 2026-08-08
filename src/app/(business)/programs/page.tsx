"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  LayoutGrid,
  Calendar,
  Target,
  MapPin,
  Clock,
  FileText,
  Download,
  Plus,
  Filter,
  CheckCircle2,
  CircleDot,
  Circle,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePrograms } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import type { ProgramStatus, ProgramType } from "@/types";
import { typeChip } from "@/lib/constants/status-surfaces";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusIcon(status: ProgramStatus) {
  if (status === "completed") return <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />;
  if (status === "ongoing")   return <CircleDot className="size-4 shrink-0 text-amber-500" />;
  return <Circle className="size-4 shrink-0 text-muted-foreground" />;
}

function statusBadge(status: ProgramStatus) {
  if (status === "completed") return <Badge className="shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">Completed</Badge>;
  if (status === "ongoing")   return <Badge className="shrink-0 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">Ongoing</Badge>;
  return <Badge variant="outline" className="shrink-0 text-muted-foreground">Planned</Badge>;
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

function fileSizeLabel(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

const ALL_TYPES: ProgramType[] = [
  "campaign", "surveillance", "screening", "training", "infrastructure", "research", "other",
];

// ── chip button helper ────────────────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
        active ? "bg-primary text-primary-foreground" : "bg-background border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  const { canCreate, canUpload } = useProgramPermissions();
  const { data, isLoading, error } = usePrograms();
  const programs = useMemo(() => data?.data ?? [], [data]);

  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [typeFilter, setTypeFilter]     = useState<ProgramType | "all">("all");
  const [filtersOpen, setFiltersOpen]   = useState(false);

  const filtered = programs.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter   !== "all" && p.type   !== typeFilter)   return false;
    return true;
  });

  const stats = {
    total:     programs.length,
    ongoing:   programs.filter((p) => p.status === "ongoing").length,
    completed: programs.filter((p) => p.status === "completed").length,
    planned:   programs.filter((p) => p.status === "planned").length,
  };

  return (
    <main className="flex-1">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/90 via-primary to-primary/95" />
        <Container className="relative py-10 sm:py-16">

          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <LayoutGrid className="size-6 sm:size-7 text-white" />
              </div>
              <div className="text-primary-foreground">
                <h1 className="text-3xl font-bold sm:text-5xl">Programs</h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-primary-foreground/90 sm:text-lg sm:mt-3">
                  Health programs across Niger State — vaccination campaigns, surveillance
                  activities, screening outreaches, training, and research initiatives.
                  Completed programs include downloadable final reports.
                </p>
              </div>
            </div>
            {canCreate && (
              <Link
                href="/programs/new"
                className={cn(buttonVariants({ variant: "onDarkSolid" }), "text-sm gap-1.5")}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Create Programme</span>
                <span className="sm:hidden">New</span>
              </Link>
            )}
          </div>

          {/* Summary stat chips — 2-col on mobile, 4-col on sm+ */}
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 max-w-2xl">
            {([
              { label: "Total",     value: stats.total,     color: "bg-white/20" },
              { label: "Ongoing",   value: stats.ongoing,   color: "bg-amber-400/30" },
              { label: "Completed", value: stats.completed, color: "bg-emerald-400/30" },
              { label: "Planned",   value: stats.planned,   color: "bg-white/10" },
            ] as const).map((s) => (
              <div key={s.label} className={`rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 text-primary-foreground ${s.color}`}>
                <p className="text-2xl font-bold tabular-nums leading-none sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/40">
        {/* Mobile: collapsed toggle */}
        <button
          className="flex w-full items-center justify-between px-4 py-3 sm:hidden"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Filter className="size-4 text-muted-foreground" />
            Filter programs
            {(statusFilter !== "all" || typeFilter !== "all") && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {[statusFilter !== "all" ? 1 : 0, typeFilter !== "all" ? 1 : 0].reduce((a, b) => a + b)}
              </span>
            )}
          </span>
          {filtersOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {/* Mobile drawer / Desktop always visible */}
        <div className={`px-4 pb-3 sm:block sm:py-4 ${filtersOpen ? "block" : "hidden"}`}>
          <Container className="px-0 sm:px-4">
            {/* Status row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-12 shrink-0">Status</span>
              {(["all", "ongoing", "completed", "planned"] as const).map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Chip>
              ))}
            </div>
            {/* Type row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-12 shrink-0">Type</span>
              <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All</Chip>
              {ALL_TYPES.map((t) => (
                <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
                  {TYPE_LABELS[t]}
                </Chip>
              ))}
            </div>
          </Container>
        </div>
      </section>

      {/* ── Program cards ───────────────────────────────────────────────────── */}
      <section className="py-8 sm:py-12 lg:py-16">
        <Container size="wide">
          {isLoading ? (
            <div className="rounded-xl border bg-muted/30 py-20 text-center text-muted-foreground">
              Loading programmes…
            </div>
          ) : error ? (
            <div className="rounded-xl border bg-muted/30 py-20 text-center text-muted-foreground">
              Couldn&apos;t load programmes. Please try again shortly.
            </div>
          ) : (
          <>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing <strong>{filtered.length}</strong> of {programs.length} programs
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 py-20 text-center text-muted-foreground">
              No programs match the selected filters.
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {filtered.map((program) => (
                <Card key={program.id} className="flex flex-col h-full">

                  {/* ── Card header ────────────────────────────────────────── */}
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {statusIcon(program.status)}
                        <CardTitle className="text-base leading-snug sm:text-lg">
                          <Link
                            href={`/programs/${program.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {program.name}
                          </Link>
                        </CardTitle>
                      </div>
                      {statusBadge(program.status)}
                    </div>

                    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[program.type]}`}>
                      <Tag className="size-3" />
                      {TYPE_LABELS[program.type]}
                    </span>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {program.description}
                    </p>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4 flex-1 pt-0">

                    {/* Meta — 2-up on all sizes, text wraps cleanly */}
                    <div className="grid grid-cols-1 gap-2 text-sm xs:grid-cols-2">
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0 mt-0.5" />
                        <span className="leading-snug">
                          {formatDate(program.startDate)}
                          {program.endDate ? (
                            <><br className="xs:hidden" /><span className="hidden xs:inline"> – </span>{formatDate(program.endDate)}</>
                          ) : ""}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-muted-foreground">
                        <Target className="size-3.5 shrink-0 mt-0.5" />
                        <span className="leading-snug">{program.primaryMetric}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{program.lgasCovered > 0 ? `${program.lgasCovered} LGAs covered` : "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5 shrink-0" />
                        <span>{program.activeDays > 0 ? `${program.activeDays} active days` : "Not started"}</span>
                      </div>
                    </div>

                    {/* Progress block */}
                    {program.targetCount > 0 && (
                      <div className="rounded-lg bg-muted/50 p-3 sm:p-4">
                        {/* 3 stat cells — no overflow on small screens */}
                        <div className="grid grid-cols-3 divide-x divide-border text-center mb-3">
                          <div className="px-1 sm:px-2">
                            <p className="text-lg font-bold text-primary tabular-nums leading-tight sm:text-2xl">
                              {program.completionPercent}%
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-xs">Completion</p>
                          </div>
                          <div className="px-1 sm:px-2">
                            <p className="text-lg font-bold tabular-nums leading-tight sm:text-2xl break-all">
                              {program.reachCount >= 1000
                                ? `${(program.reachCount / 1000).toFixed(0)}K`
                                : program.reachCount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-xs">Reached</p>
                          </div>
                          <div className="px-1 sm:px-2">
                            <p className="text-lg font-bold tabular-nums leading-tight sm:text-2xl break-all">
                              {program.targetCount >= 1000
                                ? `${(program.targetCount / 1000).toFixed(0)}K`
                                : program.targetCount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-xs">Target</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${coverageBarColor(program.completionPercent)}`}
                            style={{ width: `${Math.max(program.completionPercent, program.completionPercent > 0 ? 2 : 0)}%` }}
                            role="progressbar"
                            aria-valuenow={program.completionPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                      </div>
                    )}

                    {/* Final reports — only at 100% */}
                    {program.completionPercent === 100 && program.reports && program.reports.length > 0 && (
                      <div className="border-t pt-4 mt-auto">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          <FileText className="size-3.5" />
                          Final Reports
                        </p>
                        <ul className="space-y-2">
                          {program.reports.map((report) => (
                            <li key={report.id} className="flex flex-col gap-2 rounded-md border bg-muted/30 px-3 py-2 xs:flex-row xs:items-center xs:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-snug">{report.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {report.fileFormat} · {fileSizeLabel(report.fileSizeBytes)} · {formatDate(report.uploadedAt.split("T")[0])}
                                </p>
                              </div>
                              <a
                                href={report.url}
                                download
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 xs:w-auto xs:justify-start"
                              >
                                <Download className="size-3.5" />
                                Download
                              </a>
                            </li>
                          ))}
                        </ul>
                        {canUpload && (
                          <Link
                            href={`/programs/${program.id}/upload`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "mt-2 w-full text-xs"
                            )}
                          >
                            <Plus className="size-3" />
                            Upload Report
                          </Link>
                        )}
                      </div>
                    )}

                    {/* In-progress hint */}
                    {program.completionPercent < 100 && program.status !== "planned" && (
                      <div className="border-t pt-3 mt-auto">
                        <p className="text-xs text-muted-foreground italic">
                          Reports will be available once this program reaches 100% completion.
                        </p>
                        {canUpload && (
                          <Link
                            href={`/programs/${program.id}/upload`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "mt-2 w-full text-xs"
                            )}
                          >
                            <FileText className="size-3" />
                            Upload Report
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Admin actions for planned */}
                    {program.status === "planned" && canCreate && (
                      <div className="border-t pt-3 mt-auto flex gap-2">
                        <Link
                          href={`/programs/${program.id}/edit`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "flex-1 text-xs"
                          )}
                        >
                          Edit Timeline
                        </Link>
                        <Link
                          href={`/programs/${program.id}/edit`}
                          className={cn(buttonVariants({ size: "sm" }), "flex-1 text-xs bg-primary")}
                        >
                          Mark as Started
                        </Link>
                      </div>
                    )}

                    <div className="border-t pt-3 mt-auto">
                      <Link
                        href={`/programs/${program.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View programme dashboard
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </>
          )}
        </Container>
      </section>
    </main>
  );
}
