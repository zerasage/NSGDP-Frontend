import { apiClient } from './client';

export interface ValidateInviteResponse {
  valid: boolean;
  organisationId: string;
  organisationName: string;
  invitedEmail: string;
  role: 'contributor' | 'admin';
  expiresAt: string;
  invitedByName: string;
  /** True if this invite is for an existing registered user (upgrading
   * their role/org) — they must log in as that account to accept it,
   * instead of setting a new password. */
  isExistingUser: boolean;
  /** True if this organisation has already given electronic consent to the
   * Data Contribution & Usage Consent Agreement (captured the first time
   * anyone accepted an invite to join it). When false, this invitee is the
   * organisation's first representative to accept, and must be shown and
   * agree to the full consent agreement before their account is created. */
  organisationConsentGiven: boolean;
}

export interface AcceptInviteRequest {
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  /** Required (must be true) only when organisationConsentGiven was false. */
  consentAccepted?: boolean;
}

export interface AcceptInviteResponse {
  message: string;
  userId: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Validate an invite token
 */
export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  const response = await apiClient.get<{ data: ValidateInviteResponse }>(`/invites/${token}/validate`);
  return response.data.data;
}

/**
 * Accept an invite and create user account
 */
export async function acceptInvite(
  token: string,
  data: AcceptInviteRequest
): Promise<AcceptInviteResponse> {
  const response = await apiClient.post<{ data: AcceptInviteResponse }>(`/invites/${token}/accept`, data);
  return response.data.data;
}

/**
 * Accept an invite as the currently logged-in existing user — upgrades
 * their account's role/organisation instead of creating a new one.
 * Requires the caller to already be authenticated as the invited email.
 */
export async function acceptInviteForExistingUser(
  token: string,
  consentAccepted?: boolean
): Promise<AcceptInviteResponse> {
  const response = await apiClient.post<{ data: AcceptInviteResponse }>(
    `/invites/${token}/accept-existing`,
    { consentAccepted }
  );
  return response.data.data;
}

/**
 * Create an invite (Admin only)
 */
export interface CreateInviteRequest {
  invitedEmail: string;
  role: 'contributor' | 'admin';
  message?: string;
}

export interface InviteResponse {
  id: string;
  organisationId: string;
  organisationName: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  role: 'contributor' | 'admin';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export async function createInvite(
  organisationId: string,
  data: CreateInviteRequest
): Promise<InviteResponse> {
  const response = await apiClient.post<{ data: InviteResponse }>(
    `/admin/organisations/${organisationId}/invites`,
    data
  );
  return response.data.data;
}

/**
 * Get all invites for an organisation (Admin only)
 */
export async function getOrganisationInvites(
  organisationId: string
): Promise<InviteResponse[]> {
  const response = await apiClient.get<{ data: InviteResponse[] }>(
    `/admin/organisations/${organisationId}/invites`
  );
  return response.data.data;
}

/**
 * Revoke an invite (Admin only)
 */
export async function revokeInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ data: { message: string } }>(
    `/admin/organisations/${organisationId}/invites/${inviteId}`
  );
  return response.data.data;
}

/**
 * Resend an invite (Admin only)
 */
export async function resendInvite(
  organisationId: string,
  inviteId: string
): Promise<{ message: string }> {
  const response = await apiClient.post<{ data: { message: string } }>(
    `/admin/organisations/${organisationId}/invites/${inviteId}/resend`
  );
  return response.data.data;
}
