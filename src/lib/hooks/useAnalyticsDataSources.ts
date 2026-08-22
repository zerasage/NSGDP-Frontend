import { useQuery } from '@tanstack/react-query';
import { getAnalyticsDataSources } from '../api/analytics';
import {
  ALL_SOURCES_ID,
  type AnalyticsDataSource,
} from '../constants/analytics-sources';

export function useAnalyticsDataSources() {
  return useQuery({
    queryKey: ['analytics-data-sources'],
    queryFn: getAnalyticsDataSources,
    staleTime: 5 * 60 * 1000,
    select: (rows): AnalyticsDataSource[] => [
      {
        id: ALL_SOURCES_ID,
        name: 'All Sources (Aggregated)',
        acronym: 'ALL',
        description: 'Combined indicators from all contributing organisations',
      },
      ...rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        acronym: row.acronym ?? row.name.split(' ').map((w) => w[0]).join('').slice(0, 6),
        description: `${row.datasetCount} dataset${row.datasetCount === 1 ? '' : 's'}, ${row.indicatorCount} indicator${row.indicatorCount === 1 ? '' : 's'}`,
        datasetCount: row.datasetCount,
        indicatorCount: row.indicatorCount,
      })),
    ],
  });
}
