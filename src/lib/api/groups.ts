import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export interface GroupDatasetSummary {
  id: string;
  slug: string;
  title: string;
  format: string;
}

export interface GroupDocumentSummary {
  id: string;
  slug: string;
  title: string;
  type: string;
}

export interface PortalGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFeatured: boolean;
  datasetCount: number;
  documentCount: number;
  createdAt: string;
}

export interface PortalGroupDetail extends PortalGroup {
  datasets: GroupDatasetSummary[];
  documents: GroupDocumentSummary[];
}

// Raw shape returned by the backend (snake_case).
interface GroupApiPayload {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_featured: boolean;
  dataset_ids: string[] | null;
  document_ids: string[] | null;
  created_at: string;
}

interface GroupDetailApiPayload extends GroupApiPayload {
  datasets: GroupDatasetSummary[];
  documents: GroupDocumentSummary[];
}

function mapGroup(raw: GroupApiPayload): PortalGroup {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    isFeatured: raw.is_featured,
    datasetCount: raw.dataset_ids?.length ?? 0,
    documentCount: raw.document_ids?.length ?? 0,
    createdAt: raw.created_at,
  };
}

export interface GetGroupsParams {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
}

export async function getGroups(
  params?: GetGroupsParams
): Promise<PaginatedResponse<PortalGroup>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<GroupApiPayload>>>(
    '/groups',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.search,
        featured: params?.featured,
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapGroup) };
}

export async function getGroupBySlug(slug: string): Promise<PortalGroupDetail> {
  const response = await apiClient.get<ApiResponse<GroupDetailApiPayload>>(`/groups/${slug}`);
  const raw = response.data.data;
  return { ...mapGroup(raw), datasets: raw.datasets, documents: raw.documents };
}
