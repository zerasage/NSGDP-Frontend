import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';
import type { DocumentCategory, PortalDocument } from '@/types';

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  type?: DocumentCategory;
  organisationId?: string;
  programmeId?: string;
  search?: string;
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
      },
    }
  );
  const paginated = response.data.data;
  return { ...paginated, data: paginated.data.map(mapDocument) };
}

export async function getDocumentBySlug(slug: string): Promise<PortalDocument> {
  const response = await apiClient.get<ApiResponse<DocumentApiPayload>>(`/documents/${slug}`);
  return mapDocument(response.data.data);
}

export async function downloadDocument(
  slug: string
): Promise<{ downloadUrl: string; fileName: string }> {
  const response = await apiClient.post<ApiResponse<{ downloadUrl: string; fileName: string }>>(
    `/documents/${slug}/download`
  );
  return response.data.data;
}
