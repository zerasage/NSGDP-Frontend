import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { Program, ProgramType, ProgramStatus, ProgramReport } from '@/types';
import type { ProgramFormData } from '@/lib/schemas/program';

export interface GetProgramsParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'completed' | 'suspended' | 'archived';
  type?: ProgramType;
  lga?: string;
  organisationId?: string;
  q?: string;
  sort?: 'recent' | 'alphabetical';
}

// Raw shape returned by the backend (snake_case — matches the TypeORM
// entity columns directly, no camelCase conversion happens server-side).
interface ProgrammeApiPayload {
  id: string;
  name: string;
  slug: string;
  description: string;
  code: string | null;
  type: string | null;
  status: 'active' | 'completed' | 'suspended' | 'archived';
  start_date: string | null;
  end_date: string | null;
  organisation_id: string | null;
  manager_id: string | null;
  target_lgas: string[] | null;
  objectives: string[] | null;
  primary_metric: string | null;
  target_count: number | null;
  reach_count: number | null;
  lgas_covered_count: number | null;
  created_at: string;
  updated_at: string;
}

interface DocumentApiPayload {
  id: string;
  slug: string;
  title: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  published_at: string | null;
  created_at: string;
}

// The backend has no "planned" status — a programme's ACTIVE status covers
// both "ongoing" and "not started yet". The distinction is derived from
// start_date, which round-trips consistently: pick "planned" with a future
// start date, it's stored ACTIVE, and reads back as "planned" again.
function mapStatus(raw: ProgrammeApiPayload['status'], startDate: string | null): ProgramStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'active') {
    if (startDate && new Date(startDate) > new Date()) return 'planned';
    return 'ongoing';
  }
  // suspended/archived: not expected to reach the public UI (filtered out
  // server-side by default), fall back to the closest safe display state.
  return 'planned';
}

function activeDaysSince(startDate: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  if (start > now) return 0;
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function mapProgramme(raw: ProgrammeApiPayload): Program {
  const targetCount = raw.target_count ?? 0;
  const reachCount = raw.reach_count ?? 0;
  return {
    id: raw.slug,
    slug: raw.slug,
    name: raw.name,
    type: (raw.type ?? 'other') as ProgramType,
    status: mapStatus(raw.status, raw.start_date),
    description: raw.description,
    startDate: raw.start_date ?? raw.created_at,
    endDate: raw.end_date ?? undefined,
    primaryMetric: raw.primary_metric ?? '',
    completionPercent: targetCount > 0 ? Math.round((reachCount / targetCount) * 100) : 0,
    reachCount,
    targetCount,
    activeDays: activeDaysSince(raw.start_date),
    lgasCovered: raw.lgas_covered_count ?? raw.target_lgas?.length ?? 0,
    organisationId: raw.organisation_id ?? undefined,
    rawStatus: raw.status,
    updatedAt: raw.updated_at,
  };
}

function mapReport(raw: DocumentApiPayload): ProgramReport {
  const mime = raw.mime_type ?? '';
  const fileFormat: ProgramReport['fileFormat'] = mime.includes('spreadsheet')
    ? 'XLSX'
    : mime.includes('wordprocessingml')
      ? 'DOCX'
      : 'PDF';
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    uploadedAt: raw.published_at ?? raw.created_at,
    uploadedBy: '',
    fileSizeBytes: raw.file_size ?? 0,
    fileFormat,
    // Real download is fetched on demand (POST /documents/:slug/download)
    // rather than a static link — see useDownloadDocument().
    url: '',
  };
}

function toCreatePayload(data: ProgramFormData) {
  return {
    name: data.name,
    description: data.description,
    type: data.type,
    // organisationId is intentionally omitted — the backend derives it from
    // the caller's own organisation for CONTRIBUTOR/ADMIN; this portal has
    // no path for a caller to create/edit on behalf of another org.
    targetLgas: undefined,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    primaryMetric: data.primaryMetric || undefined,
    targetCount: data.targetCount,
    reachCount: data.reachCount,
    lgasCoveredCount: data.lgasCovered,
    status: data.status === 'completed' ? 'completed' : 'active',
  };
}

export async function getPrograms(
  params?: GetProgramsParams
): Promise<PaginatedResponse<Program>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<ProgrammeApiPayload>>>(
    '/programs',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        status: params?.status,
        type: params?.type,
        lga: params?.lga,
        organisationId: params?.organisationId,
        q: params?.q,
        sort: params?.sort,
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapProgramme) };
}

export async function getProgramBySlug(slug: string): Promise<Program> {
  const response = await apiClient.get<ApiResponse<ProgrammeApiPayload>>(`/programs/${slug}`);
  return mapProgramme(response.data.data);
}

/**
 * Org-scoped list (authenticated) — shows every status, including
 * suspended/archived programmes the public endpoint hides.
 */
export async function getOrganizationPrograms(
  params?: Omit<GetProgramsParams, 'organisationId'>
): Promise<PaginatedResponse<Program>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<ProgrammeApiPayload>>>(
    '/programs/my-organization',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        status: params?.status,
        type: params?.type,
        lga: params?.lga,
        q: params?.q,
        sort: params?.sort,
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapProgramme) };
}

/**
 * Org-scoped single lookup (authenticated) — 404s if the slug belongs to a
 * different organisation, so a caller can never load another org's
 * programme into a management form.
 */
export async function getOrganizationProgramBySlug(slug: string): Promise<Program> {
  const response = await apiClient.get<ApiResponse<ProgrammeApiPayload>>(
    `/programs/my-organization/${slug}`
  );
  return mapProgramme(response.data.data);
}

export async function createProgramApi(data: ProgramFormData): Promise<Program> {
  const response = await apiClient.post<ApiResponse<ProgrammeApiPayload>>(
    '/programs',
    toCreatePayload(data)
  );
  return mapProgramme(response.data.data);
}

export async function updateProgramApi(
  slug: string,
  data: Partial<ProgramFormData>
): Promise<Program> {
  const response = await apiClient.patch<ApiResponse<ProgrammeApiPayload>>(
    `/programs/${slug}`,
    toCreatePayload(data as ProgramFormData)
  );
  return mapProgramme(response.data.data);
}

export async function deleteProgramApi(slug: string): Promise<void> {
  await apiClient.delete(`/programs/${slug}`);
}

export async function getProgramReports(slug: string): Promise<ProgramReport[]> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<DocumentApiPayload>>>(
    `/programs/${slug}/reports`
  );
  return response.data.data.data.map(mapReport);
}

export async function createProgramReport(
  slug: string,
  data: { title: string; description: string }
): Promise<{ id: string; slug: string }> {
  const response = await apiClient.post<ApiResponse<{ id: string; slug: string }>>(
    `/programs/${slug}/reports`,
    data
  );
  return response.data.data;
}

export async function deleteProgramReportApi(slug: string, reportId: string): Promise<void> {
  await apiClient.delete(`/programs/${slug}/reports/${reportId}`);
}
