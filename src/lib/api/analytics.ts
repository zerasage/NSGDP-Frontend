import { apiClient } from './client';
import type { ApiResponse } from '../types/common';

export interface DiseaseIndicator {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  unit: string | null;
}

export interface BurdenKpis {
  indicator: string;
  year: number;
  totalCases: number;
  lgasReporting: number;
  completeness: number | null;
  monthsReporting: number;
  found: boolean;
}

export interface LgaBurdenRow {
  lgaId: string;
  lgaName: string;
  lgaCode: string;
  totalCases: number;
  missingRows: number;
  incidencePer1000: number;
  population: number | null;
}

export interface BurdenTrendAnnual {
  year: number;
  total: number;
}

export interface BurdenTrendMonthly {
  year: number;
  month: number;
  total: number;
}

export interface FacilityOutlierRow {
  facility_id: string;
  facility_name: string;
  lga_id: string;
  lga_name: string;
  total_cases: number;
  lga_avg: number;
  lga_stddev: number;
  z_score: number;
}

export interface WardBurdenRow {
  wardId: string;
  wardName: string;
  wardCode: string;
  lgaName: string;
  totalCases: number;
  missingRows: number;
  incidencePer1000: number;
  population: number;
}

export interface AnalyticsDataSourceRow {
  id: string;
  slug: string;
  name: string;
  acronym: string | null;
  datasetCount: number;
  indicatorCount: number;
}

export interface LgaTrendPoint {
  year: number;
  total: number;
}

export interface AnomalyResult {
  lga: string;
  metric: 'populationDensity' | 'facilityCount';
  value: number;
  zScore: number;
  direction: 'high' | 'low';
}

export interface LgaCoverageEntry {
  lga: string;
  population: number | null;
  facilityCount: number;
  populationDensity: number | null;
}

export interface DashboardAggregate {
  computedAt: string;
  platformStats: {
    totalDatasets: number;
    totalUsers: number;
    totalOrganisations: number;
    totalDownloads: number;
    lgasCovered: number;
  };
  downloadTrends: Array<{ date: string; downloads: number }>;
  userGrowth: Array<{ month: string; users: number }>;
  popularDatasets: Array<{ datasetId: string; title: string; downloads: number }>;
  lgaCoverage: LgaCoverageEntry[];
  anomalies: AnomalyResult[];
}

export async function getAnalyticsDashboard(): Promise<DashboardAggregate> {
  const response = await apiClient.get<ApiResponse<DashboardAggregate>>(
    '/analytics/dashboard'
  );
  return response.data.data;
}

export async function getDiseaseIndicators(): Promise<DiseaseIndicator[]> {
  const response = await apiClient.get<ApiResponse<DiseaseIndicator[]>>(
    '/analytics/indicators'
  );
  return response.data.data;
}

export async function getBurdenKpis(
  indicator: string,
  year?: number
): Promise<BurdenKpis> {
  const response = await apiClient.get<ApiResponse<BurdenKpis>>(
    '/analytics/kpis',
    { params: { indicator, ...(year != null ? { year } : {}) } }
  );
  return response.data.data;
}

export async function getBurdenLgaBurden(
  indicator: string,
  year?: number
): Promise<LgaBurdenRow[]> {
  const response = await apiClient.get<ApiResponse<LgaBurdenRow[]>>(
    '/analytics/lga-burden',
    { params: { indicator, ...(year != null ? { year } : {}) } }
  );
  return response.data.data;
}

export async function getBurdenTrends(
  indicator: string,
  opts?: { year?: number; granularity?: 'annual' | 'monthly' }
): Promise<BurdenTrendAnnual[] | BurdenTrendMonthly[]> {
  const response = await apiClient.get<
    ApiResponse<BurdenTrendAnnual[] | BurdenTrendMonthly[]>
  >('/analytics/trends', {
    params: {
      indicator,
      ...(opts?.year != null ? { year: opts.year } : {}),
      ...(opts?.granularity ? { granularity: opts.granularity } : {}),
    },
  });
  return response.data.data;
}

export async function getBurdenTopLgas(
  indicator: string,
  year?: number
): Promise<LgaBurdenRow[]> {
  const response = await apiClient.get<ApiResponse<LgaBurdenRow[]>>(
    '/analytics/top-lgas',
    { params: { indicator, ...(year != null ? { year } : {}) } }
  );
  return response.data.data;
}

export async function getBurdenOutliers(
  indicator: string,
  year?: number
): Promise<FacilityOutlierRow[]> {
  const response = await apiClient.get<ApiResponse<FacilityOutlierRow[]>>(
    '/analytics/outliers',
    { params: { indicator, ...(year != null ? { year } : {}) } }
  );
  return response.data.data;
}

export async function getAnalyticsDataSources(): Promise<AnalyticsDataSourceRow[]> {
  const response = await apiClient.get<ApiResponse<AnalyticsDataSourceRow[]>>(
    '/analytics/data-sources'
  );
  return response.data.data;
}

export async function getWardBurden(
  indicator: string,
  lga: string,
  opts?: { year?: number; organisationId?: string; limit?: number }
): Promise<WardBurdenRow[]> {
  const response = await apiClient.get<ApiResponse<WardBurdenRow[]>>(
    '/analytics/ward-burden',
    {
      params: {
        indicator,
        lga,
        ...(opts?.year != null ? { year: opts.year } : {}),
        ...(opts?.organisationId ? { organisationId: opts.organisationId } : {}),
        ...(opts?.limit != null ? { limit: opts.limit } : {}),
      },
    }
  );
  return response.data.data;
}

export async function getLgaTrend(
  indicator: string,
  lga: string
): Promise<LgaTrendPoint[]> {
  const response = await apiClient.get<ApiResponse<LgaTrendPoint[]>>(
    '/analytics/lga-trend',
    { params: { indicator, lga } }
  );
  return response.data.data;
}

/**
 * Triggers a browser download of the analytics CSV export. The endpoint is
 * public and unauthenticated, so this opens it directly rather than routing
 * through apiClient's fetch+blob machinery.
 */
export function downloadAnalyticsCsv(): void {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api';
  window.open(`${base}/analytics/export`, '_blank');
}
