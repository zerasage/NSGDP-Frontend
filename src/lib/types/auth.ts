// Auth API Types
// Request/response types for authentication endpoints
// Uses domain types from @/types for UserProfile

import type { UserRole } from "@/types";

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
  developmentPartnerId?: string;
  organisationName?: string; // Add organization name
  lga?: string;
  ward?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaMethod?: MfaMethod | null;
  createdAt: string;
  /** Delegated user permission-group actions (staff). */
  permissions?: string[];
  /** Organisation Group capabilities for the user's org (e.g. manage:programs). */
  organisationCapabilities?: string[];
}

export type MfaMethod = 'totp' | 'sms' | 'email';

export interface AuthResponse {
  tokens: AuthTokens | null; // null for pending users, or when requiresMfa is true
  user: UserProfile;
  requiresMfa?: boolean;
  mfaMethod?: MfaMethod | null;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  accessLevel?: 'public' | 'partner' | 'administrator';
  lga?: string;
  ward?: string;
  reason?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaCode?: string;
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
