import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getBurdenKpis,
  getBurdenLgaBurden,
  getBurdenTrends,
  getBurdenTopLgas,
  getBurdenOutliers,
  type BurdenTrendAnnual,
  type BurdenTrendMonthly,
} from '../api/analytics';
import { ALL_SOURCES_ID } from '../constants/analytics-sources';

export function useDiseaseBurdenAnalytics(
  indicator: string | undefined,
  year?: number,
  developmentPartnerId?: string
) {
  const y = year ?? new Date().getFullYear();
  const orgId =
    developmentPartnerId && developmentPartnerId !== ALL_SOURCES_ID
      ? developmentPartnerId
      : undefined;

  return useQuery({
    queryKey: ['disease-burden-analytics', indicator, y, orgId ?? 'all'],
    queryFn: async () => {
      if (!indicator) return null;

      const [kpis, lgaBurden, trendsAnnual, trendsMonthly, topLgas, outliers] =
        await Promise.all([
          getBurdenKpis(indicator, y, orgId),
          getBurdenLgaBurden(indicator, y, orgId),
          getBurdenTrends(indicator, {
            granularity: 'annual',
            developmentPartnerId: orgId,
          }),
          getBurdenTrends(indicator, {
            year: y,
            granularity: 'monthly',
            developmentPartnerId: orgId,
          }),
          getBurdenTopLgas(indicator, y, orgId),
          getBurdenOutliers(indicator, y, orgId),
        ]);

      return {
        kpis,
        lgaBurden,
        trendsAnnual: trendsAnnual as BurdenTrendAnnual[],
        trendsMonthly: trendsMonthly as BurdenTrendMonthly[],
        topLgas,
        outliers,
      };
    },
    enabled: !!indicator,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
