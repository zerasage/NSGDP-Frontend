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

export type OrganisationType =
  | 'government'
  | 'ngo'
  | 'private'
  | 'international'
  | 'academic'
  | 'community'
  | 'healthcare'
  | 'other';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: OrganisationType;
  /** Alias for `type` — used by the centralized @/types Organisation */
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

export interface OrganisationWithDatasets extends Organisation {
  datasets: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }>;
}

export interface GetOrganisationsParams {
  page?: number;
  limit?: number;
}

// Raw shape returned by the backend (snake_case — matches the TypeORM entity
// columns directly, no camelCase conversion happens server-side). The
// backend does not compute a per-organisation dataset count.
interface OrganisationApiPayload {
  id: string;
  name: string;
  slug: string;
  acronym?: string | null;
  description?: string | null;
  type: OrganisationType;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapOrganisation(raw: OrganisationApiPayload): Organisation {
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
 * Get all organisations with pagination
 */
export async function getOrganisations(
  params?: GetOrganisationsParams
): Promise<PaginatedResponse<Organisation>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<OrganisationApiPayload>>>('/organisations', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  });
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapOrganisation) };
}

/**
 * Get organisation by slug with datasets
 */
export async function getOrganisationBySlug(
  slug: string
): Promise<OrganisationWithDatasets> {
  const response = await apiClient.get<
    ApiResponse<{
      organisation: OrganisationApiPayload;
      datasets: OrganisationWithDatasets['datasets'];
      datasetCount: number;
    }>
  >(`/organisations/${slug}`);
  const { organisation, datasets, datasetCount } = response.data.data;
  return { ...mapOrganisation(organisation), datasets, datasetCount };
}

export interface CreateOrganisationPayload {
  name: string;
  description?: string;
  type: OrganisationType;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

/**
 * Create a new organisation (Super Admin only)
 */
export async function createOrganisation(
  payload: CreateOrganisationPayload
): Promise<Organisation> {
  const response = await apiClient.post<ApiResponse<Organisation>>(
    '/organisations',
    payload
  );
  return response.data.data;
}

/**
 * Get organisation members
 */
export async function getOrganisationMembers(orgId: string): Promise<OrganisationMember[]> {
  const response = await apiClient.get<ApiResponse<OrganisationMember[]>>(
    API_ROUTES.organisations.members(orgId)
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
): Promise<{ message: string; user: OrganisationMember }> {
  const response = await apiClient.patch<ApiResponse<{ message: string; user: OrganisationMember }>>(
    API_ROUTES.organisations.updateMemberRole(orgId, userId),
    { role }
  );
  return response.data.data;
}

/**
 * Remove member from organisation
 */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>(
    API_ROUTES.organisations.removeMember(orgId, userId)
  );
  return response.data.data;
}

export interface OrganisationMember {
  id: string;
  fullName: string;
  email: string;
  role: 'contributor' | 'admin';
  createdAt: string;
  isActive: boolean;
}
