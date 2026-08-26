import { apiClient } from './client';
import { API_ROUTES } from './routes';
import type { ApiResponse } from '../types/common';

export interface SubmitContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  website?: string;
}

export interface SubmitContactResult {
  message: string;
  id: string;
}

export async function submitContactMessage(
  data: SubmitContactPayload
): Promise<SubmitContactResult> {
  const response = await apiClient.post<ApiResponse<SubmitContactResult>>(
    API_ROUTES.contact.submit,
    data
  );
  return response.data.data;
}
