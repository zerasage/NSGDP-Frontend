import { apiClient } from './client';
import type { ApiResponse } from '../types/common';

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

/**
 * Triggers a browser download of the analytics CSV export. The endpoint is
 * public and unauthenticated, so this opens it directly rather than routing
 * through apiClient's fetch+blob machinery.
 */
export function downloadAnalyticsCsv(): void {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/api';
  window.open(`${base}/analytics/export`, '_blank');
}
