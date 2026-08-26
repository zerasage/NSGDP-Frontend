/** Sentinel + real organisation UUIDs from GET /analytics/data-sources */
export type AnalyticsDataSourceId = string;

export interface AnalyticsDataSource {
  id: AnalyticsDataSourceId;
  slug?: string;
  name: string;
  acronym: string;
  description?: string;
  datasetCount?: number;
  indicatorCount?: number;
}

export const ALL_SOURCES_ID = "all" as const;

export function getAnalyticsSourceLabel(
  sourceId: AnalyticsDataSourceId,
  sources: AnalyticsDataSource[]
): string {
  if (sourceId === ALL_SOURCES_ID) {
    return "All Sources (Aggregated)";
  }
  return sources.find((s) => s.id === sourceId)?.name ?? sourceId;
}
