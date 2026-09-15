import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevelopmentPartnerMembers,
  updateMemberRole,
  removeMember,
} from '../api/development-partners';

/**
 * Hook to fetch development partner members
 */
export function useDevelopmentPartnerMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['developmentPartner-members', orgId],
    queryFn: () => getDevelopmentPartnerMembers(orgId!),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to update member role (promote/demote)
 */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orgId,
      userId,
      role,
    }: {
      orgId: string;
      userId: string;
      role: 'contributor' | 'admin';
    }) => updateMemberRole(orgId, userId, role),
    onSuccess: (_, variables) => {
      // Invalidate members list to refetch
      queryClient.invalidateQueries({
        queryKey: ['developmentPartner-members', variables.orgId],
      });
    },
  });
}

/**
 * Hook to remove member from development partner
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, userId }: { orgId: string; userId: string }) =>
      removeMember(orgId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['developmentPartner-members', variables.orgId],
      });
    },
  });
}
