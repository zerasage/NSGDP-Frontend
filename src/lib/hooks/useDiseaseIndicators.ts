import { useQuery } from '@tanstack/react-query';
import { getDiseaseIndicators } from '../api/analytics';
import { ALL_SOURCES_ID } from '../constants/analytics-sources';

export function useDiseaseIndicators(developmentPartnerId?: string) {
  const orgId =
    developmentPartnerId && developmentPartnerId !== ALL_SOURCES_ID
      ? developmentPartnerId
      : undefined;

  return useQuery({
    queryKey: ['disease-indicators', orgId ?? 'all'],
    queryFn: () => getDiseaseIndicators(orgId),
    staleTime: 10 * 60 * 1000,
  });
}
