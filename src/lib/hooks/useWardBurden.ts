import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getWardBurden } from '../api/analytics';
import { ALL_SOURCES_ID } from '../constants/analytics-sources';

export function useWardBurden(
  indicator: string | undefined,
  lga: string | undefined,
  opts?: { organisationId?: string; year?: number }
) {
  const orgId =
    opts?.organisationId && opts.organisationId !== ALL_SOURCES_ID
      ? opts.organisationId
      : undefined;

  return useQuery({
    queryKey: ['ward-burden', indicator, lga, orgId, opts?.year],
    queryFn: () =>
      getWardBurden(indicator!, lga!, {
        year: opts?.year,
        organisationId: orgId,
        limit: 20,
      }),
    enabled: !!indicator && !!lga,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
