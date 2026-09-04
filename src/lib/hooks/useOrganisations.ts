import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganisations, getOrganisationBySlug, createOrganisation, getOrganisationActivityStats, type CreateOrganisationPayload } from '../api/organisations';

/**
 * Hook to fetch all organisations with pagination
 */
export function useOrganisations(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['organisations', page, limit],
    queryFn: () => getOrganisations({ page, limit }),
    staleTime: 10 * 60 * 1000, // 10 minutes - organisations don't change often
  });
}

/**
 * Hook to fetch a single organisation by slug with datasets
 */
export function useOrganisationBySlug(slug: string) {
  return useQuery({
    queryKey: ['organisation', slug],
    queryFn: () => getOrganisationBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
/**
 * Create a new organisation (Super Admin only)
 */
export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganisationPayload) => createOrganisation(data),
    onSuccess: () => {
      // Invalidate organisations list to refetch
      queryClient.invalidateQueries({
        queryKey: ['organisations'],
      });
    },
  });
}

/**
 * Hook to fetch activity statistics for an organisation
 */
export function useOrganisationActivityStats(orgId: string | undefined) {
  return useQuery({
    queryKey: ['organisation-activity-stats', orgId],
    queryFn: () => getOrganisationActivityStats(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 minute - activity stats should be relatively fresh
  });
}
