import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { DocumentCategory, PortalDocument } from '@/types';

export type OrgDocumentStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  type?: DocumentCategory;
  organisationId?: string;
  programmeId?: string;
  search?: string;
  status?: OrgDocumentStatus;
}

export interface OrgDocument {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: DocumentCategory;
  status: OrgDocumentStatus;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  programmeId: string | null;
  tags: string[];
  reviewComment: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Raw shape returned by the backend (snake_case — matches the TypeORM
// entity columns directly, no camelCase conversion happens server-side).
interface DocumentApiPayload {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  status: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  version: string | null;
  author: string | null;
  organisation_id: string | null;
  programme_id: string | null;
  tags: string[] | null;
  download_count: number;
  published_at: string | null;
  submitted_at?: string | null;
  review_comment?: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
}

function fileFormatFromMime(mimeType: string | null): PortalDocument['fileFormat'] {
  if (!mimeType) return 'PDF';
  if (mimeType.includes('wordprocessingml') || mimeType === 'application/msword') return 'DOCX';
  if (mimeType.includes('spreadsheetml') || mimeType === 'application/vnd.ms-excel') return 'XLSX';
  if (mimeType.includes('presentationml') || mimeType === 'application/vnd.ms-powerpoint') return 'PPTX';
  return 'PDF';
}

function mapDocument(raw: DocumentApiPayload): PortalDocument {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    category: raw.type as DocumentCategory,
    description: raw.description,
    fileFormat: fileFormatFromMime(raw.mime_type),
    fileSizeBytes: raw.file_size ?? 0,
    uploadedAt: raw.published_at ?? raw.created_at,
    uploadedBy: raw.author ?? 'NSPHCDA',
    organisationName: 'NSPHCDA',
    tags: raw.tags ?? undefined,
    // No visibility/restricted-access concept exists on documents yet —
    // every published document is treated as openly downloadable.
    restricted: false,
    programId: raw.programme_id ?? undefined,
  };
}

function mapOrgDocument(raw: DocumentApiPayload): OrgDocument {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    type: raw.type as DocumentCategory,
    status: raw.status as OrgDocumentStatus,
    fileName: raw.file_name,
    fileSizeBytes: raw.file_size,
    mimeType: raw.mime_type,
    programmeId: raw.programme_id,
    tags: raw.tags ?? [],
    reviewComment: raw.review_comment ?? null,
    submittedAt: raw.submitted_at ?? null,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function getDocuments(
  params?: GetDocumentsParams
): Promise<PaginatedResponse<PortalDocument>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<DocumentApiPayload>>>(
    '/documents',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        type: params?.type,
        organisationId: params?.organisationId,
        programmeId: params?.programmeId,
        search: params?.search,
        status: params?.status,
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapDocument) };
}

/** Authenticated org/staff list — returns full status metadata. */
export async function getOrgDocuments(
  params?: GetDocumentsParams
): Promise<PaginatedResponse<OrgDocument>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<DocumentApiPayload>>>(
    '/documents',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        type: params?.type,
        organisationId: params?.organisationId,
        programmeId: params?.programmeId,
        search: params?.search,
        status: params?.status,
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapOrgDocument) };
}

export async function getDocumentBySlug(slug: string): Promise<PortalDocument> {
  const response = await apiClient.get<ApiResponse<DocumentApiPayload>>(`/documents/${slug}`);
  return mapDocument(response.data.data);
}

export async function getOrgDocumentBySlug(slug: string): Promise<OrgDocument> {
  const response = await apiClient.get<ApiResponse<DocumentApiPayload>>(`/documents/${slug}`);
  return mapOrgDocument(response.data.data);
}

export async function downloadDocument(
  slug: string
): Promise<{ downloadUrl: string; fileName: string }> {
  const response = await apiClient.post<ApiResponse<{ downloadUrl: string; fileName: string }>>(
    `/documents/${slug}/download`
  );
  return response.data.data;
}

export interface CreateOrgDocumentPayload {
  title: string;
  description: string;
  type: DocumentCategory;
  programmeId?: string;
  author?: string;
  tags?: string[];
  version?: string;
}

export async function createOrgDocument(
  data: CreateOrgDocumentPayload
): Promise<OrgDocument> {
  const response = await apiClient.post<ApiResponse<DocumentApiPayload>>('/documents', data);
  return mapOrgDocument(response.data.data);
}

export async function updateOrgDocument(
  slug: string,
  data: Partial<CreateOrgDocumentPayload>
): Promise<OrgDocument> {
  const response = await apiClient.patch<ApiResponse<DocumentApiPayload>>(
    `/documents/${slug}`,
    data
  );
  return mapOrgDocument(response.data.data);
}

export async function submitDocumentForReview(slug: string): Promise<OrgDocument> {
  const response = await apiClient.post<ApiResponse<DocumentApiPayload>>(
    `/documents/${slug}/submit-for-review`,
    {}
  );
  return mapOrgDocument(response.data.data);
}
