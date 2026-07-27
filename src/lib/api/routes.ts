/**
 * API Routes Configuration
 * Single source of truth for all API endpoint paths
 * 
 * IMPORTANT:
 * - BASE_URL from NEXT_PUBLIC_API_URL already includes /api/v1
 * - Example: http://localhost:3001/api/v1
 * - All paths here are relative to BASE_URL
 * - Do NOT add /api or /v1 prefix to paths below
 * - Final URLs: BASE_URL + path = http://localhost:3001/api/v1/auth/login
 */

export const API_ROUTES = {
  // Authentication endpoints
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
    updateProfile: '/auth/me',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
  },

  // User endpoints
  users: {
    downloads: '/users/me/downloads',
    dashboardSummary: '/users/me/dashboard-summary',
  },

  // Organisation endpoints
  organisations: {
    list: '/organisations',
    bySlug: (slug: string) => `/organisations/${slug}`,
    members: (orgId: string) => `/organisations/${orgId}/members`,
    updateMemberRole: (orgId: string, userId: string) => `/organisations/${orgId}/members/${userId}/role`,
    removeMember: (orgId: string, userId: string) => `/organisations/${orgId}/members/${userId}/remove`,
  },

  // Category endpoints
  categories: {
    list: '/categories',
    bySlug: (slug: string) => `/categories/${slug}`,
  },

  // Dataset endpoints
  datasets: {
    list: '/datasets',
    myOrganization: '/datasets/my-organization', // Authenticated endpoint for org datasets list
    myOrganizationBySlug: (slug: string) => `/datasets/my-organization/${slug}`, // Authenticated endpoint for org dataset detail
    bySlug: (slug: string) => `/datasets/${slug}`,
    create: '/datasets',
    update: (slug: string) => `/datasets/${slug}`,
    delete: (slug: string) => `/datasets/${slug}`,
    submit: (slug: string) => `/datasets/${slug}/submit-for-review`,
    download: (slug: string) => `/datasets/${slug}/download`,
    versions: (slug: string) => `/datasets/${slug}/versions`,
    preview: (slug: string) => `/datasets/${slug}/preview`,
    accessRequests: (slug: string) => `/datasets/${slug}/access-requests`,
    myAccessRequests: '/datasets/me/access-requests',
  },

  // Review Queue endpoints — cross-org dataset review, reachable by
  // super_admin/admin role OR a user with a delegated approve:datasets /
  // publish:datasets permission (see nsgdp-backend AccessGuard).
  review: {
    queue: '/admin/review-queue',
    underReviewQueue: '/admin/review-queue/under-review',
    datasets: '/admin/datasets',
    bySlug: (slug: string) => `/admin/datasets/${slug}`,
    preview: (slug: string) => `/admin/datasets/${slug}/preview`,
    approve: (slug: string) => `/admin/datasets/${slug}/approve`,
    reject: (slug: string) => `/admin/datasets/${slug}/reject`,
    requestRevision: (slug: string) => `/admin/datasets/${slug}/request-revision`,
    markUnderReview: (slug: string) => `/admin/datasets/${slug}/mark-under-review`,
    qaChecklist: (slug: string) => `/admin/datasets/${slug}/qa-checklist`,
    publish: (slug: string) => `/admin/datasets/${slug}/publish`,
    unpublish: (slug: string) => `/admin/datasets/${slug}/unpublish`,
  },

  // Upload endpoints
  uploads: {
    upload: '/uploads',
    status: (jobId: string) => `/uploads/${jobId}`,
    cancel: (jobId: string) => `/uploads/${jobId}`,
  },

  // Notification endpoints
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },

  // Search endpoints
  search: {
    query: '/search',
    suggest: '/search/suggest',
    facilities: '/search/facilities',
  },

  // Partner data endpoints
  partnerData: {
    list: '/partner-data',
    stats: '/partner-data/stats',
  },
} as const;
