"use client";

import { useEffect, useMemo, useState } from "react";
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
import { mockPrograms } from "@/lib/mock/programs";
import { useAnalyticsDashboard } from "@/lib/hooks/useAnalyticsDashboard";
import { useDiseaseIndicators } from "@/lib/hooks/useDiseaseIndicators";
import { useDiseaseBurdenAnalytics } from "@/lib/hooks/useDiseaseBurdenAnalytics";
import { downloadAnalyticsCsv } from "@/lib/api/analytics";
import {
  ANALYTICS_DATA_SOURCES,
  PROGRAM_DATA_SOURCE,
  getAnalyticsSourceLabel,
  type AnalyticsDataSourceId,
} from "@/lib/constants/analytics-sources";
import { WardAnalyticsChart } from "@/components/charts/ward-analytics-chart";
import { HelpTooltip } from "@/components/feedback/help-tooltip";
import type { AnalyticsMetric, LGABurden } from "@/types";
import { cn } from "@/lib/utils";

type TrendMode = "annual" | "seasonal";
type AnalyticsTab = "indicators" | "ward" | "programmes";
type SortKey = keyof Pick<
  LGABurden,
  "rank" | "lga" | "totalCases" | "facilities" | "population" | "incidencePer1000"
>;

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
  const wardMockMetric: AnalyticsMetric = "severe_malaria";
  const [selectedIndicator, setSelectedIndicator] = useState<string>("");
  const [dataSource, setDataSource] = useState<AnalyticsDataSourceId>("all");
  const [trendMode, setTrendMode] = useState<TrendMode>("annual");
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>("indicators");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const { data: dashboard } = useAnalyticsDashboard();
  const { data: indicators, isLoading: indicatorsLoading } = useDiseaseIndicators();
  const { data: burdenData, isLoading: burdenLoading } =
    useDiseaseBurdenAnalytics(selectedIndicator || undefined);

  useEffect(() => {
    if (indicators?.length && !selectedIndicator) {
      setSelectedIndicator(indicators[0].slug);
    }
  }, [indicators, selectedIndicator]);

  const coverageByLga = useMemo(
    () => new Map(dashboard?.lgaCoverage.map((c) => [c.lga, c]) ?? []),
    [dashboard?.lgaCoverage]
  );

  const burdenTable = useMemo((): LGABurden[] => {
    if (!burdenData?.lgaBurden) return [];
    return burdenData.lgaBurden.map((row, i) => {
      const coverage = coverageByLga.get(row.lgaName);
      return {
        rank: i + 1,
        lga: row.lgaName,
        totalCases: row.totalCases,
        facilities: coverage?.facilityCount ?? 0,
        population: coverage?.population ?? 0,
        incidencePer1000: Math.round(row.incidencePer1000 * 10) / 10,
      };
    });
  }, [burdenData?.lgaBurden, coverageByLga]);

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

  const indicatorLabel =
    indicators?.find((i) => i.slug === selectedIndicator)?.name ?? selectedIndicator;

  const sourceLabel = getAnalyticsSourceLabel(dataSource);

  const realHealthFacilities = dashboard?.lgaCoverage.reduce(
    (sum, l) => sum + l.facilityCount,
    0
  );

  const filteredPrograms = mockPrograms.filter((p) => {
    if (p.status !== "ongoing") return false;
    if (dataSource === "all") return true;
    return PROGRAM_DATA_SOURCE[p.id] === dataSource;
  });

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
            Health Indicators tab uses real disease-burden data from ingested
            surveillance datasets. Ward-level analytics and Programme Monitoring
            tabs still use illustrative mock data. Health facility counts, LGA
            coverage, and density anomalies are computed from real platform data.
          </AlertDescription>
        </Alert>

        {/* Global filters — applies to ward/programmes tabs only */}
        {analyticsTab !== "indicators" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  Data Source
                  <HelpTooltip content="Filter analytics to datasets generated and uploaded by a specific organisation. 'All Sources' shows aggregated state-level indicators." />
                </p>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Organisation responsible for generating and uploading the underlying data
                </p>
              </div>
              <Select
                value={dataSource}
                onValueChange={(v) => v && setDataSource(v as AnalyticsDataSourceId)}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {ANALYTICS_DATA_SOURCES.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.acronym} — {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dataSource !== "all" && (
              <p className="text-sm text-muted-foreground -mt-4">
                Showing analytics for <strong className="text-foreground">{sourceLabel}</strong>
                {ANALYTICS_DATA_SOURCES.find((s) => s.id === dataSource)?.description
                  ? ` — ${ANALYTICS_DATA_SOURCES.find((s) => s.id === dataSource)?.description}`
                  : ""}
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
            <p className="text-sm text-muted-foreground">
              {dataSource === "all"
                ? "Ongoing programmes across all data sources"
                : `Ongoing programmes linked to ${sourceLabel}`}
            </p>
            {filteredPrograms.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No ongoing programmes linked to this data source.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrograms.map((p) => (
                  <Card key={p.id}>
                    <CardHeader>
                      <CardTitle className="text-base leading-snug">{p.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{p.primaryMetric}</span>
                        <span className="font-bold text-primary">{p.completionPercent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${p.completionPercent}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>{p.lgasCovered} LGAs</span>
                        <span>{p.reachCount.toLocaleString()} reached</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                <HelpTooltip content="Shows disaggregated case counts and incidence rates at ward level for selected LGAs. Red bars indicate wards exceeding the 15 per 1,000 threshold." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="size-4" />
                <AlertDescription>
                  Ward-level charts use illustrative mock data — no public ward-level disease-burden API exists yet.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium mb-2">Cases by Ward (Top 10)</p>
                  <WardAnalyticsChart
                    metric="cases"
                    dataSourceId={dataSource}
                    analyticsMetric={wardMockMetric}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    Incidence Rate per 1,000
                    <HelpTooltip content="Incidence per 1,000 population standardises case counts to allow fair comparison across wards with different populations." />
                  </p>
                  <WardAnalyticsChart
                    metric="incidencePer1000"
                    dataSourceId={dataSource}
                    analyticsMetric={wardMockMetric}
                  />
                </div>
              </div>
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
                <p className="text-xs text-muted-foreground">Total Cases ({burdenData.kpis.year})</p>
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
                  {realHealthFacilities?.toLocaleString() ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">Health Facilities</p>
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
                <p className="text-xs text-muted-foreground">LGAs Reporting</p>
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
                <p className="text-xs text-muted-foreground">Facility Outliers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Trends Over Time</CardTitle>
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
                      ["totalCases", "Total Cases"],
                      ["facilities", "Facilities"],
                      ["population", "Population"],
                      ["incidencePer1000", "Incidence / 1,000"],
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
                    <td className="py-2.5 pr-4">{row.facilities}</td>
                    <td className="py-2.5 pr-4">{row.population ? row.population.toLocaleString() : "—"}</td>
                    <td className="py-2.5 pr-4">{row.incidencePer1000}</td>
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
              LGA Density Anomalies
              <HelpTooltip content="LGAs whose population density or health-facility count sits 2+ standard deviations from the state-wide mean, computed nightly from real platform data — not disease case counts." />
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (z-score ≥ 2.0 indicates statistical outlier)
              </span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={downloadAnalyticsCsv}>
              <Download className="size-3.5" />
              Export real data (CSV)
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">
              Anomalies found ({dashboard?.anomalies.length ?? 0})
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
