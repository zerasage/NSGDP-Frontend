import { useQuery } from '@tanstack/react-query';
import { getAnalyticsDashboard } from '../api/analytics';

export function useAnalyticsDashboard() {
  return useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: getAnalyticsDashboard,
    staleTime: 5 * 60 * 1000,
  });
}
