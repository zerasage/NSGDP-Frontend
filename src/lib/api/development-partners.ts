import { apiClient } from './client';
import { API_ROUTES } from './routes';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type DevelopmentPartnerType =
  | 'government'
  | 'ngo'
  | 'private'
  | 'international'
  | 'academic'
  | 'community'
  | 'healthcare'
  | 'other';

export interface DevelopmentPartner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: DevelopmentPartnerType;
  /** Alias for `type` — used by the centralized @/types DevelopmentPartner */
  sector: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl?: string;
  brandColor?: string;
  acronym?: string;
  isActive: boolean;
  datasetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DevelopmentPartnerWithDatasets extends DevelopmentPartner {
  datasets: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
}

export interface GetDevelopmentPartnersParams {
  page?: number;
  limit?: number;
}

// Raw shape returned by the backend (snake_case — matches the TypeORM entity
// columns directly, no camelCase conversion happens server-side). The
// backend does not compute a per-development-partner dataset count.
interface DevelopmentPartnerApiPayload {
  id: string;
  name: string;
  slug: string;
  acronym?: string | null;
  description?: string | null;
  type: DevelopmentPartnerType;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapDevelopmentPartner(raw: DevelopmentPartnerApiPayload): DevelopmentPartner {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? undefined,
    type: raw.type,
    sector: raw.type,
    website: raw.website,
    email: raw.email,
    phone: raw.phone,
    address: raw.address,
    logoUrl: raw.logo_url ?? undefined,
    acronym: raw.acronym ?? undefined,
    isActive: raw.is_active,
    datasetCount: 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

/**
 * Get all development partners with pagination
 */
export async function getDevelopmentPartners(
  params?: GetDevelopmentPartnersParams
): Promise<PaginatedResponse<DevelopmentPartner>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<DevelopmentPartnerApiPayload>>>('/development-partners', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  });
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapDevelopmentPartner) };
}

/**
 * Get development partner by slug with datasets
 */
export async function getDevelopmentPartnerBySlug(
  slug: string
): Promise<DevelopmentPartnerWithDatasets> {
  const response = await apiClient.get<
    ApiResponse<{
      organisation: DevelopmentPartnerApiPayload;
      datasets: DevelopmentPartnerWithDatasets['datasets'];
      datasetCount: number;
    }>
  >(`/development-partners/${slug}`);
  const { organisation, datasets, datasetCount } = response.data.data;
  return { ...mapDevelopmentPartner(organisation), datasets, datasetCount };
}

export interface CreateDevelopmentPartnerPayload {
  name: string;
  description?: string;
  type: DevelopmentPartnerType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Create a new development partner (Super Admin only)
 */
export async function createDevelopmentPartner(
  payload: CreateDevelopmentPartnerPayload
): Promise<DevelopmentPartner> {
  const response = await apiClient.post<ApiResponse<DevelopmentPartner>>(
    '/development-partners',
    payload
  );
  return response.data.data;
}

/**
 * Get development partner members
 */
export async function getDevelopmentPartnerMembers(orgId: string): Promise<DevelopmentPartnerMember[]> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerMember[]>>(
    API_ROUTES.developmentPartners.members(orgId)
  );
  return response.data.data;
}

/**
 * Update member role (promote/demote)
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'contributor' | 'admin'
): Promise<{ message: string; user: DevelopmentPartnerMember }> {
  const response = await apiClient.patch<ApiResponse<{ message: string; user: DevelopmentPartnerMember }>>(
    API_ROUTES.developmentPartners.updateMemberRole(orgId, userId),
    { role }
  );
  return response.data.data;
}

/**
 * Remove member from development partner
 */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>(
    API_ROUTES.developmentPartners.removeMember(orgId, userId)
  );
  return response.data.data;
}

export interface DevelopmentPartnerMember {
  id: string;
  fullName: string;
  email: string;
  role: 'contributor' | 'admin';
  createdAt: string;
  isActive: boolean;
}

/**
 * Get activity statistics for a development partner (views and downloads across all datasets)
 */
export async function getDevelopmentPartnerActivityStats(
  orgId: string
): Promise<{ totalViews: number; totalDownloads: number }> {
  const response = await apiClient.get<
    ApiResponse<{ totalViews: number; totalDownloads: number }>
  >(`/development-partners/${orgId}/activity-stats`);
  return response.data.data;
}
