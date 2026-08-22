"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  MapPin,
  ArrowUpDown,
  Building,
  Info,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function HealthAnalyticsPage() {
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
    if (indicators?.length && !selectedIndicator) {
      setSelectedIndicator(indicators[0].slug);
    }
  }, [indicators, selectedIndicator]);

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
      <main className="flex-1 py-8">
        <Container size="wide" className="space-y-6">
          <PageHeaderSkeleton />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 py-8">
      <Container size="wide" className="space-y-8">
        <Alert>
          <Info className="size-4" />
          <AlertDescription>
            Health Indicators aggregates published surveillance datasets (one value
            per LGA/ward/facility/period — latest publish wins when sources overlap).
            Platform GIS metrics below are state-wide context, not tied to the selected indicator.
          </AlertDescription>
        </Alert>

        {/* Organisation filter — ward + programmes tabs only */}
        {analyticsTab !== "indicators" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  Organisation filter
                  <HelpTooltip content="Ward burden can be scoped to an organisation that published contributing datasets. Programme Monitoring filters by the programme's owning organisation." />
                </p>
                <p className="text-xs text-muted-foreground max-w-xl">
                  {analyticsTab === "ward"
                    ? "Limit ward burden to datasets published by one organisation"
                    : "Show programmes owned by one organisation"}
                </p>
              </div>
              <Select
                value={dataSource}
                onValueChange={(v) => v && setDataSource(v as AnalyticsDataSourceId)}
              >
                <SelectTrigger className="w-72">
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

            {dataSource !== ALL_SOURCES_ID && (
              <p className="text-sm text-muted-foreground -mt-4">
                Filtered to <strong className="text-foreground">{sourceLabel}</strong>
              </p>
            )}
          </>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
          {(["indicators", "ward", "programmes"] as AnalyticsTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAnalyticsTab(t)}
              className={
                analyticsTab === t
                  ? "rounded-md bg-background px-4 py-1.5 text-sm font-medium shadow-sm"
                  : "rounded-md px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {t === "indicators" ? "Health Indicators" : t === "ward" ? "Ward-Level Analytics" : "Programme Monitoring"}
            </button>
          ))}
        </div>

        {analyticsTab === "programmes" && (
          <>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Self-reported programme progress (reach / target entered by programme owners).
                {dataSource === ALL_SOURCES_ID
                  ? " Showing active programmes across all organisations."
                  : ` Filtered to programmes owned by ${sourceLabel}.`}
              </p>
            </div>
            {programmesLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : monitoringProgrammes.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
                  <p>
                    {dataSource === ALL_SOURCES_ID
                      ? "No active programmes to monitor yet."
                      : `No active programmes owned by ${sourceLabel}.`}
                  </p>
                  {dataSource !== ALL_SOURCES_ID && (
                    <p>
                      Try switching the organisation filter to{" "}
                      <button
                        type="button"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                        onClick={() => setDataSource(ALL_SOURCES_ID)}
                      >
                        All organisations
                      </button>
                      .
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {monitoringProgrammes.map((p) => {
                  const orgLabel =
                    (p.organisationId && orgNameById.get(p.organisationId)) ||
                    p.organisationName ||
                    null;
                  return (
                    <Card key={p.slug}>
                      <CardHeader className="space-y-2">
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
                        <CardTitle className="text-base leading-snug">
                          <Link href={`/programs/${p.slug}`} className="hover:underline">
                            {p.name}
                          </Link>
                        </CardTitle>
                        {orgLabel && (
                          <p className="text-xs text-muted-foreground">{orgLabel}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {p.primaryMetric || "Progress"}
                          </span>
                          <span className="font-bold text-primary">
                            {p.targetCount > 0 ? `${p.completionPercent}%` : "—"}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${p.targetCount > 0 ? Math.min(p.completionPercent, 100) : 0}%`,
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <span>
                            {p.reachCount.toLocaleString()}
                            {p.targetCount > 0
                              ? ` / ${p.targetCount.toLocaleString()} target`
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {analyticsTab === "ward" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5 text-primary" />
                Ward-Level Disease Burden
                <HelpTooltip content="Ward totals come from published burden rows with a ward_id. Many indicators are LGA-only — an empty chart usually means no ward disaggregation, not a missing LGA total." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[12rem] flex-1">
                  <p className="text-sm font-medium mb-2">Indicator</p>
                  <Select
                    value={selectedIndicator}
                    onValueChange={(v) => v && setSelectedIndicator(v)}
                    disabled={!indicators?.length}
                  >
                    <SelectTrigger className="w-full">
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
                  <p className="text-sm font-medium mb-2">LGA</p>
                  <Select value={wardLga} onValueChange={(v) => v && setWardLga(v)}>
                    <SelectTrigger className="w-full">
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
                  <p className="text-sm font-medium mb-2">Year</p>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => v && setSelectedYear(Number(v))}
                  >
                    <SelectTrigger className="w-full">
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
                <Alert>
                  <Info className="size-4" />
                  <AlertDescription>
                    No ward-level rows for <strong>{indicatorLabel}</strong> in{" "}
                    <strong>{wardLga}</strong> ({selectedYear}). This indicator may only
                    be reported at LGA level — check Health Indicators for the LGA total.
                  </AlertDescription>
                </Alert>
              )}

              {(wardBurden?.length ?? 0) > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Wards with data", wardBurden!.length],
                    [
                      "Total cases",
                      wardBurden!
                        .reduce((s, r) => s + r.totalCases, 0)
                        .toLocaleString(),
                    ],
                    [
                      "Missing rows",
                      wardBurden!.reduce((s, r) => s + r.missingRows, 0),
                    ],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg border bg-muted/20 px-4 py-3">
                      <p className="text-lg font-semibold tabular-nums">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Cases by Ward</p>
                  <WardAnalyticsChart
                    metric="cases"
                    data={wardBurden}
                    isLoading={wardLoading}
                    emptyMessage="No ward cases to chart for this selection."
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    Incidence Rate per 1,000
                    <HelpTooltip
                      content={
                        wardIncidenceHighlight != null
                          ? `Incidence per 1,000 population. Bars above ${wardIncidenceHighlight} are highlighted.`
                          : "Incidence per 1,000 population. Highlighting is off for rate/completeness indicators."
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Ward</th>
                        <th className="pb-3 pr-4 font-medium">Cases</th>
                        <th className="pb-3 pr-4 font-medium">Population</th>
                        <th className="pb-3 pr-4 font-medium">Incidence / 1,000</th>
                        <th className="pb-3 font-medium">Missing rows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(wardBurden ?? [])]
                        .sort((a, b) => b.totalCases - a.totalCases)
                        .map((row) => (
                          <tr key={row.wardId} className="border-b last:border-0">
                            <td className="py-2.5 pr-4 font-medium">{row.wardName}</td>
                            <td className="py-2.5 pr-4 tabular-nums">
                              {row.totalCases.toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 tabular-nums">
                              {row.population
                                ? row.population.toLocaleString()
                                : "—"}
                            </td>
                            <td className="py-2.5 pr-4 tabular-nums">
                              {Math.round(row.incidencePer1000 * 10) / 10}
                            </td>
                            <td className="py-2.5 tabular-nums">{row.missingRows}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {analyticsTab === "indicators" && <>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Health Analytics Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Real-time insights into health indicators across Niger State
            </p>
            {selectedIndicatorMeta && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedIndicatorMeta.category
                  ? `${selectedIndicatorMeta.category} · `
                  : ""}
                {selectedIndicatorMeta.unit
                  ? `Unit: ${selectedIndicatorMeta.unit}`
                  : "Unit: cases (whole numbers)"}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedIndicator}
              onValueChange={(v) => v && setSelectedIndicator(v)}
              disabled={!indicators?.length}
            >
              <SelectTrigger className="w-56">
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
              <SelectTrigger className="w-28">
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
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No active disease indicators found. Indicators appear here after datasets are ingested and published.
            </CardContent>
          </Card>
        )}

        {indicators?.length && burdenData && !burdenData.kpis.found && (
          <Alert variant="destructive">
            <AlertDescription>
              No data found for &ldquo;{indicatorLabel}&rdquo; in {burdenData.kpis.year}.
            </AlertDescription>
          </Alert>
        )}

        {indicators?.length && burdenData?.kpis.found && <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-red-100 p-3 dark:bg-red-950">
                <Activity className="size-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {burdenData.kpis.totalCases.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {selectedIndicatorMeta?.unit ?? "cases"} ({burdenData.kpis.year})
                  {isPartialYear && " · year-to-date"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-950">
                <BarChart3 className="size-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {burdenData.kpis.lgasReporting}
                </p>
                <p className="text-xs text-muted-foreground">LGAs reporting</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950">
                <MapPin className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCompleteness(burdenData.kpis.completeness)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Data completeness
                  {isPartialYear &&
                    ` · ${burdenData.kpis.monthsReporting} mo reported`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-950">
                <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {burdenData.outliers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Facility outliers (this indicator)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {dashboard && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "State health facilities",
                value: stateHealthFacilities?.toLocaleString() ?? "—",
                hint: "Platform GIS registry (all indicators)",
              },
              {
                label: "Published datasets",
                value: dashboard.platformStats.totalDatasets.toLocaleString(),
                hint: "Contributing to analytics",
              },
              {
                label: "LGAs with map coverage",
                value: dashboard.platformStats.lgasCovered,
                hint: "Population & facility layers",
              },
              {
                label: "Platform downloads",
                value: dashboard.platformStats.totalDownloads.toLocaleString(),
                hint: "All-time dataset downloads",
              },
            ].map(({ label, value, hint }) => (
              <Card key={label} className="border-dashed bg-muted/20">
                <CardContent className="pt-6">
                  <p className="text-xl font-semibold tabular-nums">{value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Trends Over Time</CardTitle>
              {isPartialYear && (
                <span className="text-xs text-muted-foreground">
                  {selectedYear} is partial ({burdenData.kpis.monthsReporting} months)
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={trendMode === "annual" ? "default" : "outline"}
                  onClick={() => setTrendMode("annual")}
                >
                  Trends
                </Button>
                <Button
                  size="sm"
                  variant={trendMode === "seasonal" ? "default" : "outline"}
                  onClick={() => setTrendMode("seasonal")}
                >
                  Seasonality
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                {trendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
                        stroke="#16a34a"
                        strokeWidth={2}
                        name="State Total"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 LGAs by Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                {topLGAs.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
                        fill="#16a34a"
                        name="Cases"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">LGA Burden Summary</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {(
                    [
                      ["rank", "Rank"],
                      ["lga", "LGA"],
                      ["totalCases", "Total"],
                      ["missingRows", "Missing rows"],
                      ["population", "Population"],
                      ["incidencePer1000", "Incidence / 1,000"],
                      ["facilities", "State facilities"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="pb-3 pr-4 font-medium">
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
                      row.incidencePer1000 > 7 && "bg-red-50 dark:bg-red-950/30"
                    )}
                  >
                    <td className="py-2.5 pr-4">{row.rank}</td>
                    <td className="py-2.5 pr-4 font-medium">{row.lga}</td>
                    <td className="py-2.5 pr-4">{row.totalCases.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{row.missingRows}</td>
                    <td className="py-2.5 pr-4">
                      {row.population != null ? row.population.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{row.incidencePer1000}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                      {row.facilities}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              Facility Outliers
              <HelpTooltip content="Health facilities whose case count for this indicator sits 2+ standard deviations above their LGA mean." />
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (z-score ≥ 2.0)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {burdenData.outliers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No facility outliers detected for this indicator.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Facility</th>
                    <th className="pb-3 pr-4 font-medium">LGA</th>
                    <th className="pb-3 pr-4 font-medium">Cases</th>
                    <th className="pb-3 pr-4 font-medium">Z-Score</th>
                    <th className="pb-3 font-medium">Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {burdenData.outliers.map((row) => (
                    <tr key={row.facility_id} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{row.facility_name}</td>
                      <td className="py-2.5 pr-4">{row.lga_name}</td>
                      <td className="py-2.5 pr-4">{Number(row.total_cases).toLocaleString()}</td>
                      <td className="py-2.5 pr-4">{Number(row.z_score).toFixed(2)}</td>
                      <td className="py-2.5">{outlierInterpretation(Number(row.z_score))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-1.5">
              Platform GIS health
              <HelpTooltip content="State-wide population density and facility-count anomalies from the platform map layers — not related to the selected disease indicator." />
            </CardTitle>
            <Button variant="outline" size="sm" onClick={downloadAnalyticsCsv}>
              <Download className="size-3.5" />
              Export platform CSV
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <p className="mb-4 text-sm text-muted-foreground">
              {dashboard?.anomalies.length ?? 0} LGA anomalies from nightly platform scan
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">LGA</th>
                  <th className="pb-3 pr-4 font-medium">Metric</th>
                  <th className="pb-3 pr-4 font-medium">Value</th>
                  <th className="pb-3 pr-4 font-medium">Z-Score</th>
                  <th className="pb-3 font-medium">Direction</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.anomalies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      No anomalies detected in the latest run.
                    </td>
                  </tr>
                ) : (
                  dashboard?.anomalies.map((row, i) => (
                    <tr key={`${row.lga}-${row.metric}-${i}`} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{row.lga}</td>
                      <td className="py-2.5 pr-4">
                        {row.metric === "populationDensity" ? "Population density" : "Facility count"}
                      </td>
                      <td className="py-2.5 pr-4">{row.value.toLocaleString()}</td>
                      <td className="py-2.5 pr-4">{row.zScore.toFixed(2)}</td>
                      <td
                        className={cn(
                          "py-2.5 capitalize",
                          row.direction === "high"
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {row.direction}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        </>}
        </>}
      </Container>
    </main>
  );
}
