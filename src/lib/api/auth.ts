// Auth API Functions
// Clean, typed functions for all authentication endpoints

import { apiFetch } from "./client";
import { API_ROUTES } from "./routes";
import type { ApiResponse } from "@/lib/types/common";
import type {
  AuthResponse,
  UserProfile,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
  VerifyEmailPayload,
  ResendVerificationPayload,
} from "@/lib/types/auth";

/**
 * Register a new user
 * @returns AuthResponse with tokens (or null tokens if pending approval)
 */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    API_ROUTES.auth.register,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Login with email and password
 * @returns AuthResponse with tokens and user profile
 * @throws ApiError if credentials invalid or account status prevents login
 */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    API_ROUTES.auth.login,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Logout - revokes refresh token
 * @param refreshToken - The refresh token to revoke
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiFetch<ApiResponse<void>>(API_ROUTES.auth.logout, {
    method: "POST",
    body: { refreshToken },
  });
}

/**
 * Request password reset email
 * Always returns success (security: prevents email enumeration)
 */
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.forgotPassword,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Reset password using token from email
 * @param payload - Contains reset token and new password
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.resetPassword,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Verify email using the token from the link sent at registration.
 * Logs the user in immediately on success.
 */
export async function verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
  const response = await apiFetch<ApiResponse<AuthResponse>>(
    API_ROUTES.auth.verifyEmail,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Resend the email verification link
 * Always returns success (security: prevents email enumeration)
 */
export async function resendVerification(
  payload: ResendVerificationPayload
): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.resendVerification,
    {
      method: "POST",
      body: payload,
    }
  );
  return response.data;
}

/**
 * Refresh access token using refresh token
 * @returns New access token and expiry time
 */
export async function refreshAccessToken(payload: RefreshTokenPayload): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const response = await apiFetch<
    ApiResponse<{ accessToken: string; expiresIn: number }>
  >(API_ROUTES.auth.refresh, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

/**
 * Get current user profile
 * Requires valid access token in Authorization header
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const response = await apiFetch<ApiResponse<UserProfile>>(
    API_ROUTES.auth.me,
    {
      method: "GET",
    }
  );
  return response.data;
}

// ─── MFA (two-factor authentication) ───────────────────────────────────
// Every account controls this independently, off by default. Three
// enrollment methods; TOTP and SMS/email both end in the same
// backupCodes response once confirmed.

export interface MfaSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface MfaBackupCodesResponse {
  backupCodes: string[];
}

/** Step 1 of TOTP enrollment — generates a secret + QR code to scan. */
export async function setupTotpMfa(): Promise<MfaSetupResponse> {
  const response = await apiFetch<ApiResponse<MfaSetupResponse>>(
    API_ROUTES.auth.mfaSetup,
    { method: "POST" }
  );
  return response.data;
}

/** Step 2 of TOTP enrollment — confirm with the first real code. */
export async function verifyTotpMfaSetup(code: string): Promise<MfaBackupCodesResponse> {
  const response = await apiFetch<ApiResponse<MfaBackupCodesResponse>>(
    API_ROUTES.auth.mfaVerifySetup,
    { method: "POST", body: { code } }
  );
  return response.data;
}

/** Sends an OTP via SMS — used both for enrollment and as a login/fallback channel. */
export async function sendMfaSms(): Promise<{ expiresIn: number }> {
  const response = await apiFetch<ApiResponse<{ expiresIn: number }>>(
    API_ROUTES.auth.mfaSendSms,
    { method: "POST" }
  );
  return response.data;
}

/** Confirms SMS-based MFA enrollment with the code just sent. */
export async function verifySmsMfaSetup(code: string): Promise<MfaBackupCodesResponse> {
  const response = await apiFetch<ApiResponse<MfaBackupCodesResponse>>(
    API_ROUTES.auth.mfaVerifySms,
    { method: "POST", body: { code } }
  );
  return response.data;
}

/** Sends an OTP via email — used both for enrollment and as a login/fallback channel. */
export async function sendMfaEmail(): Promise<{ expiresIn: number }> {
  const response = await apiFetch<ApiResponse<{ expiresIn: number }>>(
    API_ROUTES.auth.mfaSendEmail,
    { method: "POST" }
  );
  return response.data;
}

/** Confirms email-based MFA enrollment with the code just sent. */
export async function verifyEmailMfaSetup(code: string): Promise<MfaBackupCodesResponse> {
  const response = await apiFetch<ApiResponse<MfaBackupCodesResponse>>(
    API_ROUTES.auth.mfaVerifyEmail,
    { method: "POST", body: { code } }
  );
  return response.data;
}

/** Disables MFA entirely — requires the current password as confirmation. */
export async function disableMfa(password: string): Promise<{ message: string }> {
  const response = await apiFetch<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.mfaDisable,
    { method: "POST", body: { password } }
  );
  return response.data;
}
