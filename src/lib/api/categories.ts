import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  datasetCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithDatasets extends Category {
  datasets: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
}

export interface GetCategoriesParams {
  page?: number;
  limit?: number;
}

// Raw shape returned by the backend (snake_case — matches the TypeORM entity
// columns directly, no camelCase conversion happens server-side).
interface CategoryApiPayload {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  dataset_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapCategory(raw: CategoryApiPayload): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    icon: raw.icon,
    color: raw.color,
    datasetCount: raw.dataset_count,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Get all categories with pagination
 */
export async function getCategories(
  params?: GetCategoriesParams
): Promise<PaginatedResponse<Category>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<CategoryApiPayload>>>('/categories', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 50,
    },
  });
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapCategory) };
}

/**
 * Get category by slug with datasets
 */
export async function getCategoryBySlug(
  slug: string
): Promise<CategoryWithDatasets> {
  const response = await apiClient.get<
    ApiResponse<{ category: CategoryApiPayload; datasets: CategoryWithDatasets['datasets'] }>
  >(`/categories/${slug}`);
  const { category, datasets } = response.data.data;
  return { ...mapCategory(category), datasets };
}
