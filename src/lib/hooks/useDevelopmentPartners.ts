import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDevelopmentPartners, getDevelopmentPartnerBySlug, createDevelopmentPartner, getDevelopmentPartnerActivityStats, type CreateDevelopmentPartnerPayload } from '../api/development-partners';

/**
 * Hook to fetch all development partners with pagination
 */
export function useDevelopmentPartners(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: ['developmentPartners', page, limit],
    queryFn: () => getDevelopmentPartners({ page, limit }),
    staleTime: 10 * 60 * 1000, // 10 minutes - development partners don't change often
  });
}

/**
 * Hook to fetch a single development partner by slug with datasets
 */
export function useDevelopmentPartnerBySlug(slug: string) {
  return useQuery({
    queryKey: ['developmentPartner', slug],
    queryFn: () => getDevelopmentPartnerBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
/**
 * Create a new development partner (Super Admin only)
 */
export function useCreateDevelopmentPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDevelopmentPartnerPayload) => createDevelopmentPartner(data),
    onSuccess: () => {
      // Invalidate development partners list to refetch
      queryClient.invalidateQueries({
        queryKey: ['developmentPartners'],
      });
    },
  });
}

/**
 * Hook to fetch activity statistics for a development partner
 */
export function useDevelopmentPartnerActivityStats(orgId: string | undefined) {
  return useQuery({
    queryKey: ['developmentPartner-activity-stats', orgId],
    queryFn: () => getDevelopmentPartnerActivityStats(orgId!),
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 minute - activity stats should be relatively fresh
  });
}
