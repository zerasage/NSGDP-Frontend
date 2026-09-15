import { apiClient } from './client';
import { API_ROUTES } from './routes';

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface DownloadHistoryItem {
  id: string;
  downloadedAt: string;
  downloadCount: number;
  dataset: {
    id: string;
    slug: string;
    title: string;
    format: string;
    version: number;
    developmentPartnerId: string;
    isDeleted?: boolean;
  };
}

export interface DownloadHistoryResponse {
  data: DownloadHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardSummary {
  totalDownloads: number;
  unreadNotifications: number;
  availableDatasets: number;
  memberSince: string;
  lastLoginAt: string | null;
  // Role-specific stats (optional)
  myDatasetsCount?: number;
  pendingDatasetsCount?: number;
  myContributedDatasetsCount?: number;
  teamMembersCount?: number;
  pendingInvitesCount?: number;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  lga?: string;
  ward?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Get user download history
 */
export async function getDownloadHistory(
  page = 1,
  limit = 20
): Promise<DownloadHistoryResponse> {
  const response = await apiClient.get<ApiResponse<DownloadHistoryResponse>>(
    `${API_ROUTES.users.downloads}?page=${page}&limit=${limit}`
  );
  return response.data.data;
}

/**
 * Get dashboard summary statistics
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get<ApiResponse<DashboardSummary>>(
    API_ROUTES.users.dashboardSummary
  );
  return response.data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileData) {
  const response = await apiClient.patch<ApiResponse<unknown>>(API_ROUTES.auth.updateProfile, data);
  return response.data.data;
}

/**
 * Change password
 */
export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    API_ROUTES.auth.changePassword,
    data
  );
  return response.data.data;
}
