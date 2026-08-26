import type {
  AnalyticsMetric,
  LGABurden,
  LGACaseData,
  OutlierFacility,
} from "@/types";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import type { AnalyticsDataSourceId } from "@/lib/constants/analytics-sources";

/** Mock-only org share weights for legacy mock analytics helpers. */
const ORG_METRIC_SHARE: Partial<
  Record<AnalyticsDataSourceId, Partial<Record<AnalyticsMetric, number>> & { _default?: number }>
> = {
  "org-1": { _default: 0.28, routine_immunisation: 0.22, anc_attendance: 0.2, delivery_sba: 0.19 },
  "org-2": { _default: 0.18, anc_attendance: 0.24, delivery_sba: 0.22, u5_mortality: 0.2, death_cases: 0.21 },
  "org-3": { _default: 0.2, routine_immunisation: 0.48, anc_attendance: 0.15 },
  "org-6": { _default: 0.12, severe_malaria: 0.52, meningitis: 0.58, cholera: 0.49, diphtheria: 0.44, death_cases: 0.18 },
  "org-7": { _default: 0.14, anc_attendance: 0.38, delivery_sba: 0.41, u5_mortality: 0.35 },
  "org-8": { _default: 0.08 },
};

const ORG_FACILITY_SHARE: Partial<Record<AnalyticsDataSourceId, number>> = {
  "org-1": 0.45, "org-2": 0.35, "org-3": 0.12, "org-6": 0.05, "org-7": 0.03, "org-8": 0,
};

function getAnalyticsSourceShare(sourceId: AnalyticsDataSourceId, metric: AnalyticsMetric): number {
  if (sourceId === "all") return 1;
  const profile = ORG_METRIC_SHARE[sourceId];
  if (!profile) return 0.15;
  return profile[metric] ?? profile._default ?? 0.15;
}

function getAnalyticsFacilityShare(sourceId: AnalyticsDataSourceId): number {
  if (sourceId === "all") return 1;
  return ORG_FACILITY_SHARE[sourceId] ?? 0.1;
}

export const mockPlatformKPIs = {
  totalUsers: 248,
  totalDatasets: 24,
  downloadsThisMonth: 1847,
  pendingReview: 3,
  totalDownloads: 7002,
};

export const mockUploadsOverTime = [
  { month: "Jan", uploads: 4 },
  { month: "Feb", uploads: 6 },
  { month: "Mar", uploads: 3 },
  { month: "Apr", uploads: 8 },
  { month: "May", uploads: 5 },
  { month: "Jun", uploads: 7 },
];

export const mockDownloadsByDataset = [
  { name: "Health Facility Registry (HFR)", downloads: 1240 },
  { name: "Malaria Case Surveillance", downloads: 980 },
  { name: "Population Estimates & Boundaries", downloads: 756 },
  { name: "Routine Immunisation Coverage", downloads: 620 },
  { name: "NHMIS Aggregate Indicators", downloads: 540 },
  { name: "Ward Administrative Boundaries", downloads: 480 },
  { name: "Meningitis Cases", downloads: 390 },
  { name: "HIV Unit Data", downloads: 310 },
  { name: "TB Unit Data", downloads: 280 },
  { name: "Maternal Health Indicators", downloads: 245 },
];

export const mockNewUsersOverTime = [
  { month: "Jan", users: 12 },
  { month: "Feb", users: 18 },
  { month: "Mar", users: 15 },
  { month: "Apr", users: 22 },
  { month: "May", users: 19 },
  { month: "Jun", users: 28 },
];

export const mockAnalyticsKPIs = {
  totalCases: 48291,
  healthFacilities: 2191,
  lgasCovered: 25,
  outlierFacilities: 14,
};

const METRIC_BASE: Record<AnalyticsMetric, number> = {
  severe_malaria: 4200,
  meningitis: 890,
  cholera: 340,
  diphtheria: 210,
  anc_attendance: 12400,
  delivery_sba: 6800,
  routine_immunisation: 15600,
  u5_mortality: 420,
  death_cases: 380,
};

function seededValue(
  metric: AnalyticsMetric,
  year: number,
  month?: number,
  sourceId: AnalyticsDataSourceId = "all"
): number {
  const base = METRIC_BASE[metric];
  const growth = (year - 2013) * 0.04;
  const seasonal = month !== undefined ? Math.sin((month / 12) * Math.PI * 2) * 0.15 : 0;
  const hash = (metric.charCodeAt(0) + year + (month ?? 0)) % 17;
  const raw = Math.round(base * (1 + growth + seasonal) * (0.85 + hash * 0.02));
  return Math.round(raw * getAnalyticsSourceShare(sourceId, metric));
}

export function getTrendData(
  metric: AnalyticsMetric,
  mode: "annual" | "seasonal" = "annual",
  sourceId: AnalyticsDataSourceId = "all"
) {
  if (mode === "annual") {
    return Array.from({ length: 13 }, (_, i) => {
      const year = 2013 + i;
      return { date: String(year), cases: seededValue(metric, year, undefined, sourceId) };
    });
  }
  const year = 2024;
  return Array.from({ length: 12 }, (_, i) => ({
    date: new Date(year, i).toLocaleString("en", { month: "short" }),
    cases: seededValue(metric, year, i + 1, sourceId),
  }));
}

export function getLGACaseData(
  metric: AnalyticsMetric,
  sourceId: AnalyticsDataSourceId = "all"
): LGACaseData[] {
  return NIGER_STATE_LGAS.map((lga, i) => {
    const pop = Math.round(
      (120000 + i * 18000 + (lga.length % 5) * 5000) *
        (sourceId === "all" ? 1 : getAnalyticsSourceShare(sourceId, metric) * 2.2)
    );
    const cases = Math.round(
      seededValue(metric, 2024, undefined, sourceId) * (0.3 + (i % 10) * 0.08)
    );
    const facilities = Math.max(
      1,
      Math.round((12 + (i % 8) * 3) * getAnalyticsFacilityShare(sourceId))
    );
    return { lga, cases, population: Math.max(pop, 1000), facilities };
  });
}

export function getLGABurdenTable(
  metric: AnalyticsMetric,
  sourceId: AnalyticsDataSourceId = "all"
): LGABurden[] {
  return getLGACaseData(metric, sourceId)
    .map((row) => ({
      rank: 0,
      lga: row.lga,
      totalCases: row.cases,
      missingRows: 0,
      facilities: row.facilities,
      population: row.population,
      incidencePer1000: Math.round((row.cases / row.population) * 1000 * 10) / 10,
    }))
    .sort((a, b) => b.totalCases - a.totalCases)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function getTopLGAs(
  metric: AnalyticsMetric,
  n = 10,
  sourceId: AnalyticsDataSourceId = "all"
) {
  return getLGABurdenTable(metric, sourceId).slice(0, n).map((r) => ({
    lga: r.lga,
    cases: r.totalCases,
  }));
}

export function getOutlierFacilities(
  metric: AnalyticsMetric,
  sourceId: AnalyticsDataSourceId = "all"
): OutlierFacility[] {
  const outliers: OutlierFacility[] = [
    { facility: "Chanchaga General Hospital", lga: "Chanchaga", totalCases: 842, zScore: 3.2, interpretation: "Very high – investigate" },
    { facility: "Bida General Hospital", lga: "Bida", totalCases: 691, zScore: 2.8, interpretation: "Very high – investigate" },
    { facility: "Suleja PHC 1", lga: "Suleja", totalCases: 412, zScore: 2.4, interpretation: "Elevated – monitor" },
    { facility: "Kontagora General Hospital", lga: "Kontagora", totalCases: 378, zScore: 2.1, interpretation: "Elevated – monitor" },
    { facility: "Minna PHC 2", lga: "Minna", totalCases: 298, zScore: 2.0, interpretation: "Borderline outlier" },
  ];
  const scale =
    (METRIC_BASE[metric] / METRIC_BASE.severe_malaria) *
    getAnalyticsSourceShare(sourceId, metric);
  const sliceCount =
    sourceId === "all"
      ? outliers.length
      : Math.max(1, Math.ceil(outliers.length * getAnalyticsSourceShare(sourceId, metric)));

  return outliers.slice(0, sliceCount).map((o) => ({
    ...o,
    totalCases: Math.round(o.totalCases * scale),
  }));
}

export function getAnalyticsDashboard(
  metric: AnalyticsMetric,
  sourceId: AnalyticsDataSourceId = "all"
) {
  const burden = getLGABurdenTable(metric, sourceId);
  const outliers = getOutlierFacilities(metric, sourceId);
  const facilityShare = getAnalyticsFacilityShare(sourceId);

  return {
    dataSourceId: sourceId,
    kpis: {
      totalCases: burden.reduce((s, r) => s + r.totalCases, 0),
      healthFacilities: Math.round(mockAnalyticsKPIs.healthFacilities * facilityShare),
      lgasCovered: burden.some((r) => r.totalCases > 0) ? 25 : 0,
      outlierFacilities: outliers.length,
    },
    trendAnnual: getTrendData(metric, "annual", sourceId),
    trendSeasonal: getTrendData(metric, "seasonal", sourceId),
    topLGAs: getTopLGAs(metric, 10, sourceId),
    burdenTable: burden,
    outliers,
  };
}

export function getGisBurdenBubbles(
  metric: AnalyticsMetric,
  year = 2024,
  sourceId: AnalyticsDataSourceId = "all"
) {
  const data = getLGACaseData(metric, sourceId);
  const maxCases = Math.max(...data.map((d) => d.cases));
  return data.map((d, i) => {
    const coords = {
      Chanchaga: { lat: 9.6, lng: 6.55 },
      Bida: { lat: 9.08, lng: 6.02 },
      Suleja: { lat: 9.18, lng: 7.18 },
      Kontagora: { lat: 10.4, lng: 5.6 },
      Bosso: { lat: 9.62, lng: 6.58 },
    }[d.lga] ?? { lat: 9.5 + (i % 5) * 0.12, lng: 6.0 + (i % 7) * 0.1 };
    return {
      lga: d.lga,
      cases: Math.round(d.cases * (year / 2024)),
      lat: coords.lat,
      lng: coords.lng,
      radius: 8 + (d.cases / maxCases) * 32,
    };
  });
}

// Legacy exports
export const mockLGABurden = getLGABurdenTable("severe_malaria");
export function getMockTrendData() {
  return getTrendData("severe_malaria", "annual").map((d) => ({
    year: d.date,
    cases: d.cases,
  }));
}
