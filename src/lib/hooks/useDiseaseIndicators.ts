import { useQuery } from '@tanstack/react-query';
import { getDiseaseIndicators } from '../api/analytics';

export function useDiseaseIndicators() {
  return useQuery({
    queryKey: ['disease-indicators'],
    queryFn: getDiseaseIndicators,
    staleTime: 10 * 60 * 1000,
  });
}
