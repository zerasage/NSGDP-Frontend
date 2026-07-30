// Auth API Types
// Request/response types for authentication endpoints
// Uses domain types from @/types for UserProfile

import type { UserRole } from "@/types";

// Mirrors nsgdp-backend's PermissionActionKey (src/modules/admin/constants/permission-actions.ts).
// Duplicated here since the repos share no code — keep in sync manually.
export type PermissionActionKey =
  | "approve:datasets"
  | "publish:datasets"
  | "archive:datasets"
  | "invite:users"
  | "deactivate:users"
  | "promote:org-admin"
  | "view:restricted"
  | "download:restricted"
  | "create:programs"
  | "edit:programs"
  | "delete:programs"
  | "upload:programs";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  status: 'pending' | 'active' | 'suspended' | 'archived';
  organisationId?: string;
  organisationName?: string; // Add organization name
  lga?: string;
  ward?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  permissions: PermissionActionKey[];
}

export interface AuthResponse {
  tokens: AuthTokens | null; // null for pending users
  user: UserProfile;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  accessLevel?: 'public' | 'partner' | 'administrator';
  reason?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}
