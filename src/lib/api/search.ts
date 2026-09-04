import { apiClient } from './client';

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface BackendSearchResult {
  type: 'dataset' | 'organisation' | 'user';
  id: string;
  title: string;
  description?: string;
  slug?: string;
  relevance?: number;
  metadata?: Record<string, unknown>;
}

export interface BackendSearchResponse {
  results: BackendSearchResult[];
  total: number;
  query: string;
  page: number;
  limit: number;
}

/**
 * Cross-entity search against the real backend. The public portal only ever
 * requests datasets + organisations — `user` results are an admin-only
 * concept and there's no "People" surface here.
 */
export async function searchAll(
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<BackendSearchResponse> {
  const response = await apiClient.get<ApiResponse<BackendSearchResponse>>('/search', {
    params: {
      q: query,
      page,
      limit,
      types: 'dataset,organisation',
      catalogue: true,
    },
  });
  return response.data.data;
}
