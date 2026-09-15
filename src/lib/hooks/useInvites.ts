import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDevelopmentPartnerInvites,
  createInvite,
  revokeInvite,
  resendInvite,
  type CreateInviteRequest,
} from "@/lib/api/invites";

/**
 * Get all invites for a development partner
 */
export function useDevelopmentPartnerInvites(developmentPartnerId: string) {
  return useQuery({
    queryKey: ["invites", developmentPartnerId],
    queryFn: () => getDevelopmentPartnerInvites(developmentPartnerId),
    enabled: !!developmentPartnerId,
    retry: false, // Don't retry on error
  });
}

/**
 * Create a new invite
 */
export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      developmentPartnerId,
      data,
    }: {
      developmentPartnerId: string;
      data: CreateInviteRequest;
    }) => createInvite(developmentPartnerId, data),
    onSuccess: (_, variables) => {
      // Invalidate invites list for this development partner
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.developmentPartnerId],
      });
    },
  });
}

/**
 * Revoke an invite
 */
export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      developmentPartnerId,
      inviteId,
    }: {
      developmentPartnerId: string;
      inviteId: string;
    }) => revokeInvite(developmentPartnerId, inviteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.developmentPartnerId],
      });
    },
  });
}

/**
 * Resend an invite
 */
export function useResendInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      developmentPartnerId,
      inviteId,
    }: {
      developmentPartnerId: string;
      inviteId: string;
    }) => resendInvite(developmentPartnerId, inviteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invites", variables.developmentPartnerId],
      });
    },
  });
}
