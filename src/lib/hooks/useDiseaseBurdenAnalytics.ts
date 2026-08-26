import { useQuery } from '@tanstack/react-query';
import {
  getBurdenKpis,
  getBurdenLgaBurden,
  getBurdenTrends,
  getBurdenTopLgas,
  getBurdenOutliers,
  type BurdenTrendAnnual,
  type BurdenTrendMonthly,
} from '../api/analytics';

export function useDiseaseBurdenAnalytics(
  indicator: string | undefined,
  year?: number
) {
  const y = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: ['disease-burden-analytics', indicator, y],
    queryFn: async () => {
      if (!indicator) return null;

      const [kpis, lgaBurden, trendsAnnual, trendsMonthly, topLgas, outliers] =
        await Promise.all([
          getBurdenKpis(indicator, y),
          getBurdenLgaBurden(indicator, y),
          getBurdenTrends(indicator, { granularity: 'annual' }),
          getBurdenTrends(indicator, { year: y, granularity: 'monthly' }),
          getBurdenTopLgas(indicator, y),
          getBurdenOutliers(indicator, y),
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
  });
}
