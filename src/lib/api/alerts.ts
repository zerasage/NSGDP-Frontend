import { apiClient } from './client';
import type { ApiResponse } from '../types/common';
import type { OutbreakAlert } from '@/types';

export async function getActiveAlerts(): Promise<OutbreakAlert[]> {
  const response = await apiClient.get<ApiResponse<OutbreakAlert[]>>(
    '/alerts/active'
  );
  return response.data.data;
}
