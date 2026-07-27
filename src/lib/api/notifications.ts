import { apiClient } from './client';
import { API_ROUTES } from './routes';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

// Backend notification types
export type BackendNotificationType = 
  | 'dataset_approved'
  | 'dataset_rejected'
  | 'dataset_revision_requested'
  | 'account_approved'
  | 'account_suspended'
  | 'new_dataset_available'
  | 'system_announcement';

// Display types for UI
export type DisplayNotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: BackendNotificationType; // Backend type
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  link?: string;
  data?: Record<string, unknown>;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Map backend notification type to display type for styling
 */
export function getDisplayType(type: BackendNotificationType): DisplayNotificationType {
  switch (type) {
    case 'dataset_approved':
    case 'account_approved':
    case 'new_dataset_available':
      return 'success';
    case 'dataset_rejected':
    case 'account_suspended':
      return 'error';
    case 'dataset_revision_requested':
      return 'warning';
    case 'system_announcement':
    default:
      return 'info';
  }
}

/**
 * Get user notifications
 */
export async function getNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (unreadOnly) {
    params.append('unread_only', 'true');
  }

  const response = await apiClient.get<ApiResponse<NotificationsResponse>>(
    `${API_ROUTES.notifications.list}?${params.toString()}`
  );
  return response.data.data;
}

/**
 * Get count of unread notifications
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    API_ROUTES.notifications.unreadCount
  );
  return response.data.data.count;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>(
    API_ROUTES.notifications.markRead(id)
  );
  return response.data.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string; updated: number }> {
  const response = await apiClient.patch<ApiResponse<{ message: string; updated: number }>>(
    API_ROUTES.notifications.markAllRead
  );
  return response.data.data;
}
