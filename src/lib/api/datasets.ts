import { apiClient } from './client';
import { API_ROUTES } from './routes';
import type { PaginatedResponse } from '../types/common';

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type DatasetFormat =
  | 'csv'
  | 'excel'
  | 'json'
  | 'geojson'
  | 'shapefile'
  | 'geopackage'
  | 'kml'
  | 'pdf'
  | 'other';

export type DatasetVisibility = 'public' | 'restricted' | 'private';

export type DatasetStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived';

export interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string | null;
  organisation_id: string | null;
  owner_id: string;
  format: DatasetFormat;
  visibility: DatasetVisibility;
  status: DatasetStatus;
  tags: string[] | null;
  temporal_coverage_start: string | null;
  temporal_coverage_end: string | null;
  geographic_coverage: string[] | null;
  disease_indicators: string[] | null;
  file_path: string | null;
  file_size: number | null;
  file_hash: string | null;
  version: number;
  download_count: number;
  view_count: number;
  license: string | null;
  methodology: string | null;
  limitations: string | null;
  responsible_dept: string | null;
  contact_person: string | null;
  contact_email: string | null;
  update_frequency: string | null;
  metadata: Record<string, unknown> | null;
  key_attributes: Record<string, unknown>[] | null;
  bbox: unknown | null;
  has_spatial_data: boolean;
  programme_id: string | null;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
}

// A dataset can have more than one file uploaded to it over time — each
// upload gets its own row instead of silently replacing the previous one.
export interface DatasetFile {
  id: string;
  dataset_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_hash: string | null;
  format: DatasetFormat;
  uploaded_by: string | null;
  created_at: string;
}

export interface DatasetListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  organisationId?: string;
  format?: DatasetFormat;
  visibility?: DatasetVisibility;
  status?: DatasetStatus;
  search?: string;
  tags?: string; // comma-separated
  lga?: string;
  ward?: string;
  diseaseIndicators?: string;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  sortBy?: 'created_at' | 'title' | 'download_count' | 'view_count';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateDatasetDto {
  title: string;
  description: string;
  categoryId?: string;
  format: DatasetFormat;
  visibility?: DatasetVisibility;
  status?: DatasetStatus; // Add status to allow direct submission as PENDING
  tags?: string[];
  temporalCoverageStart?: string;
  temporalCoverageEnd?: string;
  geographicCoverage?: string; // Backend expects a single string, not array
  diseaseIndicators?: string[];
  license?: string;
  methodology?: string;
  limitations?: string;
  responsibleDept?: string;
  contactPerson?: string;
  contactEmail?: string;
  updateFrequency?: string;
  programmeId?: string;
  organisationId?: string; // For admins to create on behalf of org
}

export interface UpdateDatasetDto {
  title?: string;
  description?: string;
  categoryId?: string;
  format?: DatasetFormat;
  visibility?: DatasetVisibility;
  status?: DatasetStatus;
  tags?: string[];
  temporalCoverageStart?: string;
  temporalCoverageEnd?: string;
  geographicCoverage?: string; // Backend expects a single string
  diseaseIndicators?: string[];
  license?: string;
  methodology?: string;
  limitations?: string;
  responsibleDept?: string;
  contactPerson?: string;
  contactEmail?: string;
  updateFrequency?: string;
  programmeId?: string;
}

export interface DatasetVersion {
  id: string;
  version: number;
  created_at: string;
  changes: string;
}

export interface DatasetVersionHistory {
  current: Dataset;
  versions: DatasetVersion[];
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresIn: number;
  fileName: string;
}

export interface DatasetPreview {
  dataset: Dataset;
  preview: unknown;
  cached: boolean;
  rowCount?: number;
}

export interface SubmitResponse {
  message: string;
  ticket: unknown;
  dataset: Dataset;
}

// Mirrors nsgdp-backend src/modules/datasets/dataset-insights.service.ts —
// deterministic column profiling computed at upload time, not an AI feature.
export interface DatasetMetricInsight {
  column: string;
  min: number;
  max: number;
  first: number;
  latest: number;
  percentChange: number | null;
  trend: 'increasing' | 'decreasing' | 'stable';
  series: Array<{ period: string; value: number }>;
}

export interface DatasetInsights {
  generatedAt: string;
  rowCount: number;
  dateColumn: string;
  metrics: DatasetMetricInsight[];
}

/**
 * Get all datasets with filters and pagination
 */
export async function getDatasets(
  params?: DatasetListParams
): Promise<PaginatedResponse<Dataset>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Dataset>>>(
    '/datasets',
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

/**
 * Get organization datasets (authenticated, shows all statuses including drafts)
 */
export async function getOrganizationDatasets(
  params?: Omit<DatasetListParams, 'organisationId'>
): Promise<PaginatedResponse<Dataset>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<Dataset>>>(
    API_ROUTES.datasets.myOrganization,
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

/**
 * Get dataset by slug (public endpoint - only shows approved datasets)
 */
export async function getDatasetBySlug(slug: string): Promise<Dataset> {
  const response = await apiClient.get<ApiResponse<Dataset>>(`/datasets/${slug}`);
  return response.data.data;
}

/**
 * Get organization dataset by slug (authenticated endpoint - shows all statuses)
 * Use this when authenticated users view their own organization's datasets
 */
export async function getOrganizationDatasetBySlug(slug: string): Promise<Dataset> {
  const response = await apiClient.get<ApiResponse<Dataset>>(API_ROUTES.datasets.myOrganizationBySlug(slug));
  return response.data.data;
}

/**
 * Create a new dataset (metadata only)
 */
export async function createDataset(
  data: CreateDatasetDto
): Promise<Dataset> {
  const response = await apiClient.post<ApiResponse<Dataset>>('/datasets', data);
  return response.data.data;
}

/**
 * Update dataset metadata
 */
export async function updateDataset(
  slug: string,
  data: UpdateDatasetDto
): Promise<Dataset> {
  const response = await apiClient.patch<ApiResponse<Dataset>>(
    `/datasets/${slug}`,
    data
  );
  return response.data.data;
}

/**
 * Delete (archive) a dataset
 */
export async function deleteDataset(slug: string): Promise<void> {
  await apiClient.delete(`/datasets/${slug}`);
}

/**
 * Submit dataset for review (draft/rejected → pending)
 */
export async function submitDatasetForReview(slug: string): Promise<SubmitResponse> {
  const response = await apiClient.post<ApiResponse<SubmitResponse>>(
    `/datasets/${slug}/submit-for-review`
  );
  return response.data.data;
}

/**
 * Request a dataset file URL. `mode: "download"` (default) logs a download and
 * increments the dataset's download count; `mode: "view"` returns an inline-viewable
 * URL without counting as a download. Pass `fileId` to target a specific upload
 * when the dataset has more than one file; omit it for the current/most recent file.
 */
export async function downloadDataset(
  slug: string,
  mode: "download" | "view" = "download",
  fileId?: string
): Promise<DownloadResponse> {
  const query = new URLSearchParams({ mode, ...(fileId ? { fileId } : {}) });
  const response = await apiClient.post<ApiResponse<DownloadResponse>>(
    `/datasets/${slug}/download?${query.toString()}`
  );
  return response.data.data;
}

/**
 * List every file ever uploaded to a dataset (a dataset can receive more
 * than one upload over time).
 */
export async function getDatasetFiles(slug: string): Promise<DatasetFile[]> {
  const response = await apiClient.get<ApiResponse<DatasetFile[]>>(
    `/datasets/${slug}/files`
  );
  return response.data.data;
}

/**
 * Get dataset version history
 */
export async function getDatasetVersions(
  slug: string
): Promise<DatasetVersionHistory> {
  const response = await apiClient.get<ApiResponse<DatasetVersionHistory>>(
    `/datasets/${slug}/versions`
  );
  return response.data.data;
}

/**
 * Get dataset preview (first 100 rows for tabular, simplified GeoJSON for spatial)
 */
export async function getDatasetPreview(slug: string): Promise<DatasetPreview> {
  const response = await apiClient.get<ApiResponse<DatasetPreview>>(
    `/datasets/${slug}/preview`
  );
  return response.data.data;
}

export async function getDatasetInsights(slug: string): Promise<DatasetInsights | null> {
  const response = await apiClient.get<ApiResponse<DatasetInsights | null>>(
    `/datasets/${slug}/insights`
  );
  return response.data.data;
}
