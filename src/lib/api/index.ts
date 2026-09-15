// API Module Exports
// Central export point for all API functions

// Core client
export { apiFetch, ApiError } from "./client";

// Auth API functions
export {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  refreshAccessToken,
  getCurrentUser,
} from "./auth";

// Invites API functions
export {
  validateInvite,
  acceptInvite,
  acceptInviteForExistingUser,
  createInvite,
  getDevelopmentPartnerInvites,
  revokeInvite,
  resendInvite,
  type ValidateInviteResponse,
  type AcceptInviteRequest,
  type AcceptInviteResponse,
  type CreateInviteRequest,
  type InviteResponse,
} from "./invites";

// Development Partners API functions
export {
  getDevelopmentPartners,
  getDevelopmentPartnerBySlug,
  type DevelopmentPartner,
  type DevelopmentPartnerType,
  type DevelopmentPartnerWithDatasets,
  type GetDevelopmentPartnersParams,
} from "./development-partners";

// Categories API functions
export {
  getCategories,
  getCategoryBySlug,
  type Category,
  type CategoryWithDatasets,
  type GetCategoriesParams,
} from "./categories";
