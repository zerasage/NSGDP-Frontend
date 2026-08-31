"use client";

import { useParams } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { useProgramBySlug, useProgramReports } from "@/lib/hooks/usePrograms";
import { useDownloadDocument } from "@/lib/hooks/useDocuments";
import { useAuth } from "@/lib/auth";
import { RichHtmlContent } from "@/components/programs/rich-html-content";
import { objectivesToEditorHtml } from "@/lib/api/programs";
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

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: program, isLoading, error } = useProgramBySlug(id);
  const { data: reports } = useProgramReports(id);
  const downloadMutation = useDownloadDocument();

  const handleDownloadReport = (slug: string | undefined, title: string) => {
    if (!slug) {
      toast.error("This report has no downloadable file yet");
      return;
    }
    downloadMutation.mutate(slug, {
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
      <Container className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading programme…
      </Container>
    );
  }

  if (error || !program) {
    return (
      <Container className="py-16 text-center text-muted-foreground">
        Programme not found.{" "}
        <Link href="/programs" className="text-primary hover:underline">Back to Programmes</Link>
      </Container>
    );
  }

  const canManage = !!user?.organisationId && user.organisationId === program.organisationId;
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
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/programs">
              <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{program.name}</h1>
                <Badge
                  variant="secondary"
                  className={cn(
                    program.status === "completed" && "bg-emerald-100 text-emerald-800",
                    program.status === "ongoing" && "bg-amber-100 text-amber-800",
                  )}
                >
                  {program.status}
                </Badge>
                <Badge variant="outline" className="capitalize">{program.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
            </div>
            {canManage && (
              <div className="ml-auto flex flex-wrap gap-2">
                <Link
                  href={`/my-programs/${program.slug}/edit?progress=1`}
                  className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
                >
                  <TrendingUp className="size-3.5" />
                  Update progress
                </Link>
                <Link
                  href={`/my-programs/${program.slug}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <Settings className="size-3.5" />
                  Manage
                </Link>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {headline.percent != null && (
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{headline.percent}%</p>
                  <p className="text-xs text-muted-foreground">{headline.basis ?? "Progress"}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {tracksLgaCoverage(mode) && lga.target > 0 && (
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lga.reach} / {lga.target}</p>
                  <p className="text-xs text-muted-foreground">LGAs covered</p>
                </div>
              </CardContent>
            </Card>
          )}
          {tracksOutcomeMetric(mode) && program.targetCount > 0 && (
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {program.reachCount.toLocaleString()} / {program.targetCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{program.primaryMetric || "Outcome"}</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timelineValue}</p>
                <p className="text-xs text-muted-foreground">{timelineLabel}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Tracking: {modeLabel}</p>

            {tracksLgaCoverage(mode) && lgaPct != null && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">LGA coverage</span>
                  <span className="text-muted-foreground">{lga.reach} / {lga.target} LGAs</span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lgaPct}%` }} />
                </div>
              </div>
            )}

            {tracksOutcomeMetric(mode) && outcomePct != null && (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">{program.primaryMetric || "Outcome"}</span>
                  <span className="text-muted-foreground">
                    {program.reachCount.toLocaleString()} / {program.targetCount.toLocaleString()}
                  </span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${outcomePct}%` }} />
                </div>
              </div>
            )}

            {headline.percent == null && (
              <p className="text-sm text-muted-foreground">No progress recorded yet.</p>
            )}
          </CardContent>
        </Card>

        {program.objectives?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <RichHtmlContent html={objectivesToEditorHtml(program.objectives)} />
            </CardContent>
          </Card>
        ) : null}

        {(program.targetLgas?.length ?? 0) > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target LGAs ({program.targetLgas!.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Programme Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports?.map((report) => (
              <div key={report.id} className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="size-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.fileFormat} · {new Date(report.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownloadReport(report.slug, report.title)}
                  disabled={downloadMutation.isPending}
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            ))}
            {!reports?.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">No documents yet.</p>
            )}
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
