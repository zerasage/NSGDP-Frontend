"use client";

import { useEffect, useMemo, useState, Suspense, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Database,
  Globe2,
  Hospital,
  MapPin,
  ArrowUpDown,
  Building,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Container } from "@/components/layout/container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsDashboard } from "@/lib/hooks/useAnalyticsDashboard";
import { useDiseaseIndicators } from "@/lib/hooks/useDiseaseIndicators";
import { useDiseaseBurdenAnalytics } from "@/lib/hooks/useDiseaseBurdenAnalytics";
import { useAnalyticsDataSources } from "@/lib/hooks/useAnalyticsDataSources";
import { useWardBurden } from "@/lib/hooks/useWardBurden";
import { usePrograms } from "@/lib/hooks/usePrograms";
import { downloadAnalyticsCsv } from "@/lib/api/analytics";
import {
  ALL_SOURCES_ID,
  getAnalyticsSourceLabel,
  type AnalyticsDataSourceId,
} from "@/lib/constants/analytics-sources";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { WardAnalyticsChart } from "@/components/charts/ward-analytics-chart";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import { formatDate } from "@/lib/utils/date";
import type { LGABurden } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type TrendMode = "annual" | "seasonal";
type AnalyticsTab = "indicators" | "ward" | "programmes";
type SortKey = keyof Pick<
  LGABurden,
  "rank" | "lga" | "totalCases" | "missingRows" | "facilities" | "population" | "incidencePer1000"
>;

const TAB_LABELS: Record<AnalyticsTab, string> = {
  indicators: "Health Indicators",
  ward: "Ward-level",
  programmes: "Programmes",
};

function formatCompleteness(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function outlierInterpretation(zScore: number): string {
  const z = Math.abs(zScore);
  if (z >= 3) return "Very high – investigate";
  if (z >= 2.5) return "Elevated – monitor";
  return "Borderline outlier";
}

type MetricTone =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "muted";

const METRIC_TONE: Record<
  MetricTone,
  { card: string; well: string; icon: string; value: string }
> = {
  primary: {
    card: "border-primary/20 bg-primary/[0.04]",
    well: "border-primary/20 bg-primary/10",
    icon: "text-primary",
    value: "text-foreground",
  },
  success: {
    card: "border-success/25 bg-success/[0.06]",
    well: "border-success/25 bg-success/15",
    icon: "text-success",
    value: "text-foreground",
  },
  info: {
    card: "border-info/25 bg-info/[0.06]",
    well: "border-info/25 bg-info/15",
    icon: "text-info",
    value: "text-foreground",
  },
  warning: {
    card: "border-warning/30 bg-warning/[0.08]",
    well: "border-warning/30 bg-warning/20",
    icon: "text-amber-700 dark:text-warning",
    value: "text-foreground",
  },
  destructive: {
    card: "border-destructive/20 bg-destructive/[0.05]",
    well: "border-destructive/20 bg-destructive/10",
    icon: "text-destructive",
    value: "text-foreground",
  },
  muted: {
    card: "border-dashed bg-muted/20",
    well: "border-border bg-muted/50",
    icon: "text-muted-foreground",
    value: "text-foreground",
  },
};

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: typeof Activity;
  tone?: MetricTone;
}) {
  const t = METRIC_TONE[tone];
  return (
    <div className={cn("rounded-2xl border p-4", t.card)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg border",
              t.well
            )}
          >
            <Icon className={cn("size-4", t.icon)} aria-hidden />
          </div>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tabular-nums tracking-tight sm:text-2xl",
          t.value
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold leading-6">{title}</h2>
          {description ? (
            <p className="text-[13px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[13px] font-medium text-foreground">{children}</p>
  );
}

function HealthAnalyticsContent() {
  const searchParams = useSearchParams();
  const indicatorFromUrl = searchParams.get("indicator");
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [dataSource, setDataSource] = useState<AnalyticsDataSourceId>(ALL_SOURCES_ID);
  const [wardLga, setWardLga] = useState<string>("");
  const [trendMode, setTrendMode] = useState<TrendMode>("annual");
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("indicators");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const { data: dashboard } = useAnalyticsDashboard();
  const { data: indicators, isLoading: indicatorsLoading } = useDiseaseIndicators();
  const { data: dataSources = [] } = useAnalyticsDataSources();
  const { data: burdenData, isLoading: burdenLoading } =
    useDiseaseBurdenAnalytics(selectedIndicator || undefined, selectedYear);

  const orgFilterId = dataSource === ALL_SOURCES_ID ? undefined : dataSource;
  const { data: wardBurden, isLoading: wardLoading } = useWardBurden(
    selectedIndicator || undefined,
    wardLga || undefined,
    { organisationId: orgFilterId, year: selectedYear }
  );

  const { data: programmesPage, isLoading: programmesLoading } = usePrograms(
    {
      status: "active",
      organisationId: orgFilterId,
      limit: 50,
    },
    { enabled: analyticsTab === "programmes" }
  );

  const monitoringProgrammes = useMemo(
    () =>
      (programmesPage?.data ?? []).filter(
        (p) => p.status === "ongoing" || p.status === "planned"
      ),
    [programmesPage?.data]
  );

  useEffect(() => {
    if (!indicators?.length) return;
    if (
      indicatorFromUrl &&
      indicators.some((i) => i.slug === indicatorFromUrl)
    ) {
      setSelectedIndicator(indicatorFromUrl);
      return;
    }
    if (!selectedIndicator) {
      setSelectedIndicator(indicators[0].slug);
    }
  }, [indicators, selectedIndicator, indicatorFromUrl]);

  useEffect(() => {
    if (!wardLga && NIGER_STATE_LGAS.length) {
      setWardLga(NIGER_STATE_LGAS[0]);
    }
  }, [wardLga]);

  const lgaOptions = useMemo(() => {
    const fromCoverage = dashboard?.lgaCoverage.map((c) => c.lga) ?? [];
    if (fromCoverage.length) return fromCoverage.sort();
    return [...NIGER_STATE_LGAS];
  }, [dashboard?.lgaCoverage]);

  const coverageByLga = useMemo(
    () => new Map(dashboard?.lgaCoverage.map((c) => [c.lga, c]) ?? []),
    [dashboard?.lgaCoverage]
  );

  const burdenTable = useMemo((): LGABurden[] => {
    if (!burdenData?.lgaBurden) return [];
    return burdenData.lgaBurden.map((row, i) => {
      const coverage = coverageByLga.get(row.lgaName);
      const population = row.population ?? coverage?.population ?? null;
      const incidencePer1000 =
        population && row.totalCases > 0
          ? Math.round((row.totalCases / population) * 1000 * 10) / 10
          : row.incidencePer1000;
      return {
        rank: i + 1,
        lga: row.lgaName,
        totalCases: row.totalCases,
        missingRows: row.missingRows,
        facilities: coverage?.facilityCount ?? 0,
        population,
        incidencePer1000,
      };
    });
  }, [burdenData?.lgaBurden, coverageByLga]);

  const yearOptions = useMemo(() => {
    const fromTrends = burdenData?.trendsAnnual.map((p) => p.year) ?? [];
    const merged = new Set([...fromTrends, selectedYear, new Date().getFullYear()]);
    return [...merged].sort((a, b) => b - a);
  }, [burdenData?.trendsAnnual, selectedYear]);

  const selectedIndicatorMeta = indicators?.find((i) => i.slug === selectedIndicator);

  const isPartialYear =
    selectedYear === new Date().getFullYear() &&
    (burdenData?.kpis.monthsReporting ?? 0) > 0 &&
    (burdenData?.kpis.monthsReporting ?? 0) < 12;

  const wardIncidenceHighlight = useMemo(() => {
    const unit = selectedIndicatorMeta?.unit?.toLowerCase() ?? "";
    const category = selectedIndicatorMeta?.category?.toLowerCase() ?? "";
    if (
      category === "completeness" ||
      unit.includes("%") ||
      unit.includes("rate") ||
      unit.includes("proportion")
    ) {
      return null;
    }
    return 15;
  }, [selectedIndicatorMeta]);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of dataSources) {
      map.set(s.id, s.acronym ? `${s.acronym} — ${s.name}` : s.name);
    }
    return map;
  }, [dataSources]);

  const trendData = useMemo(() => {
    if (!burdenData) return [];
    if (trendMode === "annual") {
      return burdenData.trendsAnnual.map((p) => ({
        date: String(p.year),
        cases: p.total,
      }));
    }
    return burdenData.trendsMonthly.map((p) => ({
      date: MONTH_NAMES[(p.month ?? 1) - 1] ?? String(p.month),
      cases: p.total,
    }));
  }, [burdenData, trendMode]);

  const topLGAs = useMemo(
    () =>
      (burdenData?.topLgas ?? []).map((r) => ({
        lga: r.lgaName,
        cases: r.totalCases,
      })),
    [burdenData?.topLgas]
  );

  const sortedBurden = useMemo(() => {
    if (!burdenTable.length) return [];
    return [...burdenTable].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
  }, [burdenTable, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "lga");
    }
  };

  const indicatorLabel = selectedIndicatorMeta?.name ?? selectedIndicator;

  const sourceLabel = getAnalyticsSourceLabel(dataSource, dataSources);

  const stateHealthFacilities = dashboard?.lgaCoverage.reduce(
    (sum, l) => sum + l.facilityCount,
    0
  );

  const indicatorsLoadingState =
    analyticsTab === "indicators" &&
    (indicatorsLoading || (burdenLoading && !burdenData));

  if (indicatorsLoadingState) {
    return (
      <main className="flex-1 py-6">
        <Container size="wide" className="space-y-6">
          <PageHeaderSkeleton />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-2xl" />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 py-6">
      <Container size="wide" className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1">
              <Activity className="size-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Surveillance
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-8 tracking-tight">
              Health analytics
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Published disease-burden insights across Niger State. Platform GIS
              figures are state-wide context, not tied to the selected indicator.
            </p>
          </div>
          {analyticsTab === "indicators" && burdenData?.kpis.found ? (
            <Button variant="outline" size="sm" className="h-9" onClick={downloadAnalyticsCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1">
          {(["indicators", "ward", "programmes"] as AnalyticsTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAnalyticsTab(t)}
              className={cn(
                "h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors sm:px-4",
                analyticsTab === t
                  ? "bg-primary text-primary-foreground shadow-none"
                  : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
              )}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Organisation filter — ward + programmes */}
        {analyticsTab !== "indicators" && (
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
            <div className="space-y-1">
              <p className="text-[13px] font-medium">Organisation filter</p>
              <p className="text-xs text-muted-foreground">
                {analyticsTab === "ward"
                  ? "Limit ward burden to datasets published by one organisation."
                  : "Show programmes owned by one organisation."}
              </p>
            </div>
            <Select
              value={dataSource}
              onValueChange={(v) => v && setDataSource(v as AnalyticsDataSourceId)}
            >
              <SelectTrigger className="h-9 w-full sm:w-72">
                <SelectValue placeholder="Select organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SOURCES_ID}>All organisations</SelectItem>
                {dataSources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.acronym} — {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {dataSource !== ALL_SOURCES_ID && analyticsTab !== "indicators" && (
          <p className="text-xs text-muted-foreground">
            Filtered to <span className="font-medium text-foreground">{sourceLabel}</span>
          </p>
        )}

        {analyticsTab === "programmes" && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">
              Self-reported programme progress (reach / target from programme owners).
              {dataSource === ALL_SOURCES_ID
                ? " Showing active programmes across organisations."
                : ` Filtered to programmes owned by ${sourceLabel}.`}
            </p>
            {programmesLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            ) : monitoringProgrammes.length === 0 ? (
              <div className="rounded-2xl border bg-card px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {dataSource === ALL_SOURCES_ID
                    ? "No active programmes to monitor yet."
                    : `No active programmes owned by ${sourceLabel}.`}
                </p>
                {dataSource !== ALL_SOURCES_ID && (
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 h-auto p-0"
                    onClick={() => setDataSource(ALL_SOURCES_ID)}
                  >
                    Show all organisations
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {monitoringProgrammes.map((p) => {
                  const orgLabel =
                    (p.organisationId && orgNameById.get(p.organisationId)) ||
                    p.organisationName ||
                    null;
                  return (
                    <article
                      key={p.slug}
                      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={p.status === "ongoing" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {p.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {(p.type || "other").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/programs/${p.slug}`}
                          className="text-base font-semibold leading-snug hover:underline"
                        >
                          {p.name}
                        </Link>
                        {orgLabel ? (
                          <p className="text-xs text-muted-foreground">{orgLabel}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-muted-foreground">
                            {p.primaryMetric || "Progress"}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {p.targetCount > 0 ? `${p.completionPercent}%` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${p.targetCount > 0 ? Math.min(p.completionPercent, 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {p.reachCount.toLocaleString()}
                          {p.targetCount > 0
                            ? ` / ${p.targetCount.toLocaleString()}`
                            : " reached"}
                        </span>
                        <span>{p.lgasCovered} LGAs</span>
                        <span>
                          {formatDate(p.startDate)}
                          {p.endDate ? ` → ${formatDate(p.endDate)}` : ""}
                        </span>
                        <span>
                          {p.activeDays > 0 ? `${p.activeDays} days active` : "Not started"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {analyticsTab === "ward" && (
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Building className="size-4 text-primary" aria-hidden />
                </span>
                Ward-level disease burden
                <HelpTooltip content="Ward totals come from published burden rows with a ward_id. Many indicators are LGA-only — an empty chart usually means no ward disaggregation, not a missing LGA total." />
              </span>
            }
            description="Drill into ward counts for a selected LGA and year."
          >
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[12rem] flex-1">
                  <FieldLabel>Indicator</FieldLabel>
                  <Select
                    value={selectedIndicator}
                    onValueChange={(v) => v && setSelectedIndicator(v)}
                    disabled={!indicators?.length}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select indicator" />
                    </SelectTrigger>
                    <SelectContent>
                      {(indicators ?? []).map((ind) => (
                        <SelectItem key={ind.slug} value={ind.slug}>
                          {ind.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[12rem] flex-1">
                  <FieldLabel>LGA</FieldLabel>
                  <Select value={wardLga} onValueChange={(v) => v && setWardLga(v)}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {lgaOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <FieldLabel>Year</FieldLabel>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => v && setSelectedYear(Number(v))}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!wardLoading && (wardBurden?.length ?? 0) === 0 && (
                <div className="rounded-xl border border-dashed px-4 py-6 text-center text-[13px] text-muted-foreground">
                  No ward-level rows for <span className="font-medium text-foreground">{indicatorLabel}</span> in{" "}
                  <span className="font-medium text-foreground">{wardLga}</span> ({selectedYear}).
                  This indicator may only be reported at LGA level.
                </div>
              )}

              {(wardBurden?.length ?? 0) > 0 && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Wards with data"
                    value={wardBurden!.length}
                    icon={MapPin}
                    tone="info"
                  />
                  <MetricCard
                    label="Total cases"
                    value={wardBurden!
                      .reduce((s, r) => s + r.totalCases, 0)
                      .toLocaleString()}
                    icon={Activity}
                    tone="destructive"
                  />
                  <MetricCard
                    label="Missing rows"
                    value={wardBurden!.reduce((s, r) => s + r.missingRows, 0)}
                    icon={AlertTriangle}
                    tone="warning"
                  />
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[13px] font-medium">Cases by ward</p>
                  <WardAnalyticsChart
                    metric="cases"
                    data={wardBurden}
                    isLoading={wardLoading}
                    emptyMessage="No ward cases to chart for this selection."
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-[13px] font-medium inline-flex items-center gap-1.5">
                    Incidence per 1,000
                    <HelpTooltip
                      content={
                        wardIncidenceHighlight != null
                          ? `Bars above ${wardIncidenceHighlight} are highlighted.`
                          : "Highlighting is off for rate/completeness indicators."
                      }
                    />
                  </p>
                  <WardAnalyticsChart
                    metric="incidencePer1000"
                    data={wardBurden}
                    isLoading={wardLoading}
                    incidenceHighlightThreshold={wardIncidenceHighlight}
                    emptyMessage="No ward incidence to chart for this selection."
                  />
                </div>
              </div>

              {(wardBurden?.length ?? 0) > 0 && (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left">
                        <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Ward
                        </th>
                        <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Cases
                        </th>
                        <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Population
                        </th>
                        <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Incidence / 1k
                        </th>
                        <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Missing
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(wardBurden ?? [])]
                        .sort((a, b) => b.totalCases - a.totalCases)
                        .map((row) => (
                          <tr key={row.wardId} className="border-b last:border-0">
                            <td className="px-4 py-3.5 font-medium">{row.wardName}</td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {row.totalCases.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {row.population ? row.population.toLocaleString() : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {Math.round(row.incidencePer1000 * 10) / 10}
                            </td>
                            <td className="px-4 py-3.5 text-right tabular-nums">
                              {row.missingRows}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>
        )}

        {analyticsTab === "indicators" && <>
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="space-y-1">
            <p className="text-[13px] font-medium">Indicator & year</p>
            <p className="text-xs text-muted-foreground">
              {selectedIndicatorMeta?.category
                ? `${selectedIndicatorMeta.category} · `
                : ""}
              {selectedIndicatorMeta?.unit
                ? `Unit: ${selectedIndicatorMeta.unit}`
                : "Unit: cases"}
              {" · "}
              Latest publish wins when sources overlap.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedIndicator}
              onValueChange={(v) => v && setSelectedIndicator(v)}
              disabled={!indicators?.length}
            >
              <SelectTrigger className="h-9 w-full sm:w-64">
                <SelectValue placeholder="Select indicator" />
              </SelectTrigger>
              <SelectContent>
                {(indicators ?? []).map((ind) => (
                  <SelectItem key={ind.slug} value={ind.slug}>
                    {ind.name}
                    {ind.unit ? ` (${ind.unit})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => v && setSelectedYear(Number(v))}
              disabled={!indicators?.length}
            >
              <SelectTrigger className="h-9 w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!indicators?.length && (
          <div className="rounded-2xl border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No published disease indicators yet. They appear after datasets are ingested and published.
          </div>
        )}

        {indicators?.length && burdenData && !burdenData.kpis.found && (
          <Alert variant="destructive">
            <AlertDescription>
              No data found for &ldquo;{indicatorLabel}&rdquo; in {burdenData.kpis.year}.
            </AlertDescription>
          </Alert>
        )}

        {indicators?.length && burdenData?.kpis.found && <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={`Total ${selectedIndicatorMeta?.unit ?? "cases"}`}
            value={burdenData.kpis.totalCases.toLocaleString()}
            hint={`${burdenData.kpis.year}${isPartialYear ? " · year-to-date" : ""}`}
            icon={Activity}
            tone="destructive"
          />
          <MetricCard
            label="LGAs reporting"
            value={burdenData.kpis.lgasReporting}
            icon={BarChart3}
            tone="success"
          />
          <MetricCard
            label="Data completeness"
            value={formatCompleteness(burdenData.kpis.completeness)}
            hint={
              isPartialYear
                ? `${burdenData.kpis.monthsReporting} months reported`
                : undefined
            }
            icon={MapPin}
            tone="info"
          />
          <MetricCard
            label="Facility outliers"
            value={burdenData.outliers.length}
            hint="This indicator only"
            icon={AlertTriangle}
            tone="warning"
          />
        </div>

        {dashboard && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="State health facilities"
              value={stateHealthFacilities?.toLocaleString() ?? "—"}
              hint="Platform GIS registry"
              icon={Hospital}
              tone="muted"
            />
            <MetricCard
              label="Published datasets"
              value={dashboard.platformStats.totalDatasets.toLocaleString()}
              hint="Contributing to analytics"
              icon={Database}
              tone="muted"
            />
            <MetricCard
              label="LGAs with map coverage"
              value={dashboard.platformStats.lgasCovered}
              hint="Population & facility layers"
              icon={Globe2}
              tone="muted"
            />
            <MetricCard
              label="Platform downloads"
              value={dashboard.platformStats.totalDownloads.toLocaleString()}
              hint="All-time downloads"
              icon={Download}
              tone="muted"
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Activity className="size-4 text-primary" aria-hidden />
                </span>
                Trends over time
              </span>
            }
            description={
              isPartialYear
                ? `${selectedYear} is partial (${burdenData.kpis.monthsReporting} months)`
                : undefined
            }
            action={
              <div className="flex rounded-lg border bg-muted/30 p-0.5">
                <Button
                  size="sm"
                  variant={trendMode === "annual" ? "default" : "ghost"}
                  className="h-8 px-3"
                  onClick={() => setTrendMode("annual")}
                >
                  Annual
                </Button>
                <Button
                  size="sm"
                  variant={trendMode === "seasonal" ? "default" : "ghost"}
                  className="h-8 px-3"
                  onClick={() => setTrendMode("seasonal")}
                >
                  Seasonal
                </Button>
              </div>
            }
          >
              <div className="h-56 w-full sm:h-72">
                {trendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                    No trend data for this indicator.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cases"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "var(--primary)" }}
                        activeDot={{ r: 5 }}
                        name="State total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
          </Panel>

          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg border border-info/25 bg-info/15">
                  <BarChart3 className="size-4 text-info" aria-hidden />
                </span>
                Top 10 LGAs by cases
              </span>
            }
          >
              <div className="h-56 w-full sm:h-72">
                {topLGAs.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                    No LGA data for this indicator.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topLGAs}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="lga"
                        tick={{ fontSize: 10 }}
                        width={55}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="cases"
                        fill="var(--info)"
                        name="Cases"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
          </Panel>
        </div>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/50">
                <MapPin className="size-4 text-muted-foreground" aria-hidden />
              </span>
              LGA burden summary
            </span>
          }
        >
            <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  {(
                    [
                      ["rank", "Rank"],
                      ["lga", "LGA"],
                      ["totalCases", "Total"],
                      ["missingRows", "Missing"],
                      ["population", "Population"],
                      ["incidencePer1000", "Incidence / 1k"],
                      ["facilities", "Facilities"],
                    ] as const
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort(key)}
                      >
                        {label}
                        <ArrowUpDown className="size-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedBurden.map((row) => (
                  <tr
                    key={row.lga}
                    className={cn(
                      "border-b last:border-0",
                      row.incidencePer1000 > 7 && "bg-destructive/5"
                    )}
                  >
                    <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                      {row.rank}
                    </td>
                    <td className="px-4 py-3.5 font-medium">{row.lga}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {row.totalCases.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {row.missingRows}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {row.population != null ? row.population.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {row.incidencePer1000}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                      {row.facilities}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-warning/30 bg-warning/20">
                <AlertTriangle className="size-4 text-amber-700 dark:text-warning" aria-hidden />
              </span>
              Facility outliers
              <HelpTooltip content="Facilities whose case count sits 2+ standard deviations from their LGA mean." />
            </span>
          }
          description="z-score ≥ 2.0 for this indicator"
        >
            {burdenData.outliers.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">
                No facility outliers detected for this indicator.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Facility
                    </th>
                    <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      LGA
                    </th>
                    <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Cases
                    </th>
                    <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Z-score
                    </th>
                    <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Interpretation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {burdenData.outliers.map((row) => (
                    <tr key={row.facility_id} className="border-b last:border-0">
                      <td className="px-4 py-3.5 font-medium">{row.facility_name}</td>
                      <td className="px-4 py-3.5">{row.lga_name}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {Number(row.total_cases).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {Number(row.z_score).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {outlierInterpretation(Number(row.z_score))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
        </Panel>

        <Panel
          title={
            <span className="inline-flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-info/25 bg-info/15">
                <Globe2 className="size-4 text-info" aria-hidden />
              </span>
              Platform GIS health
              <HelpTooltip content="State-wide population density and facility-count anomalies — not related to the selected disease indicator." />
            </span>
          }
          description={`${dashboard?.anomalies.length ?? 0} LGA anomalies from the nightly platform scan`}
          action={
            <Button variant="outline" size="sm" className="h-8" onClick={downloadAnalyticsCsv}>
              <Download className="size-3.5" />
              Export CSV
            </Button>
          }
        >
            <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b bg-muted/30 text-left">
                  <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    LGA
                  </th>
                  <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Metric
                  </th>
                  <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Value
                  </th>
                  <th className="h-11 px-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Z-score
                  </th>
                  <th className="h-11 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Direction
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No anomalies detected in the latest run.
                    </td>
                  </tr>
                ) : (
                  dashboard?.anomalies.map((row, i) => (
                    <tr key={`${row.lga}-${row.metric}-${i}`} className="border-b last:border-0">
                      <td className="px-4 py-3.5 font-medium">{row.lga}</td>
                      <td className="px-4 py-3.5">
                        {row.metric === "populationDensity"
                          ? "Population density"
                          : "Facility count"}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {row.value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right tabular-nums">
                        {row.zScore.toFixed(2)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3.5 capitalize",
                          row.direction === "high"
                            ? "text-destructive"
                            : "text-amber-700 dark:text-amber-400"
                        )}
                      >
                        {row.direction}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
        </Panel>
        </>}
        </>}
      </Container>
    </main>
  );
}

export default function HealthAnalyticsPage() {
  return (
    <Suspense fallback={<PageHeaderSkeleton />}>
      <HealthAnalyticsContent />
    </Suspense>
  );
}
