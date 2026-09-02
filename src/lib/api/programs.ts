import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { Program, ProgramType, ProgramStatus, ProgramReport, ProgrammeProgressMode } from '@/types';
import type { ProgramFormData, ProgramProgressUpdateData } from '@/lib/schemas/program';
import { headlineProgressPercent } from '@/lib/constants/program-progress';
import { objectivesFromEditorHtml, objectivesToEditorHtml } from '@/lib/objectives-html';
import { daysActiveSince } from '@/lib/utils/date';

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
  covered_lgas: string[] | null;
  objectives: string[] | null;
  progress_mode: ProgrammeProgressMode | null;
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

function mapStatus(raw: ProgrammeApiPayload['status'], startDate: string | null): ProgramStatus {
  if (raw === 'completed') return 'completed';
  if (raw === 'active') {
    if (startDate && new Date(startDate) > new Date()) return 'planned';
    return 'ongoing';
  }
  return 'planned';
}

function parseOptionalCount(raw: string | undefined): number | undefined {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : undefined;
}

function mapProgramme(raw: ProgrammeApiPayload): Program {
  const targetCount = raw.target_count ?? 0;
  const reachCount = raw.reach_count ?? 0;
  const targetLgas = raw.target_lgas ?? [];
  const coveredLgas = raw.covered_lgas ?? [];
  const progressMode = raw.progress_mode ?? 'lga_coverage';

  const progressSource = {
    progressMode,
    primaryMetric: raw.primary_metric,
    targetLgas,
    coveredLgas,
    lgasCovered: raw.lgas_covered_count,
    targetCount: raw.target_count,
    reachCount: raw.reach_count,
  };

  return {
    id: raw.slug,
    slug: raw.slug,
    name: raw.name,
    type: (raw.type ?? 'other') as ProgramType,
    status: mapStatus(raw.status, raw.start_date),
    rawStatus: raw.status,
    description: raw.description,
    startDate: raw.start_date ?? raw.created_at,
    endDate: raw.end_date ?? undefined,
    progressMode,
    targetLgas,
    coveredLgas,
    objectives: raw.objectives ?? [],
    primaryMetric: raw.primary_metric ?? '',
    completionPercent: headlineProgressPercent(progressSource) ?? 0,
    reachCount,
    targetCount,
    activeDays: daysActiveSince(raw.start_date ?? raw.created_at),
    lgasCovered: raw.lgas_covered_count ?? coveredLgas.length,
    organisationId: raw.organisation_id ?? undefined,
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
    url: '',
  };
}

function toFormPayload(
  data: Partial<ProgramFormData>,
  options?: { includeStatus?: boolean }
) {
  const payload: Record<string, unknown> = {};
  const includeStatus = options?.includeStatus ?? true;

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.type !== undefined) payload.type = data.type;
  if (data.targetLgas !== undefined) payload.targetLgas = data.targetLgas;
  if (data.startDate !== undefined) payload.startDate = data.startDate;
  if (data.endDate !== undefined) payload.endDate = data.endDate;
  if (data.progressMode !== undefined) payload.progressMode = data.progressMode;

  if (data.objectives !== undefined) {
    payload.objectives = objectivesFromEditorHtml(data.objectives);
  }

  if (data.progressMode && data.progressMode !== 'lga_coverage') {
    if (data.primaryMetric !== undefined) {
      payload.primaryMetric = data.primaryMetric.trim() || undefined;
    }
    if (data.targetCount !== undefined) {
      payload.targetCount = parseOptionalCount(data.targetCount);
    }
  }

  if (includeStatus && data.status !== undefined) {
    payload.status = data.status === 'completed' ? 'completed' : 'active';
  }

  return payload;
}

function toProgressPayload(data: ProgramProgressUpdateData) {
  return {
    coveredLgas: data.coveredLgas,
    reachCount: data.reachCount,
    status: data.status,
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

export async function getOrganizationProgramBySlug(slug: string): Promise<Program> {
  const response = await apiClient.get<ApiResponse<ProgrammeApiPayload>>(
    `/programs/my-organization/${slug}`
  );
  return mapProgramme(response.data.data);
}

export async function createProgramApi(data: ProgramFormData): Promise<Program> {
  const response = await apiClient.post<ApiResponse<ProgrammeApiPayload>>(
    '/programs',
    toFormPayload(data, { includeStatus: false })
  );
  return mapProgramme(response.data.data);
}

export async function updateProgramApi(
  slug: string,
  data: Partial<ProgramFormData>
): Promise<Program> {
  const response = await apiClient.patch<ApiResponse<ProgrammeApiPayload>>(
    `/programs/${slug}`,
    toFormPayload(data)
  );
  return mapProgramme(response.data.data);
}

export async function updateProgramProgressApi(
  slug: string,
  data: ProgramProgressUpdateData
): Promise<Program> {
  const response = await apiClient.patch<ApiResponse<ProgrammeApiPayload>>(
    `/programs/${slug}`,
    toProgressPayload(data)
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

export { objectivesToEditorHtml };
