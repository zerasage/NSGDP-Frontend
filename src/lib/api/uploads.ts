import { apiClient } from './client';

// Backend wraps all responses in this structure
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface UploadResponse {
  jobId: string;
  fileName: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}

export interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  fileSize: number;
  filePath?: string;
  error?: string;
}

/**
 * Upload a file and optionally associate it with a dataset or document
 */
export async function uploadFile(
  file: File,
  datasetId?: string,
  documentId?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (datasetId) {
    formData.append('datasetId', datasetId);
  }
  if (documentId) {
    formData.append('documentId', documentId);
  }

  const response = await apiClient.post<ApiResponse<UploadResponse>>(
    '/uploads',
    formData
    // Don't set Content-Type header - browser will set it automatically with boundary
  );
  return response.data.data;
}

/**
 * Get upload job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await apiClient.get<ApiResponse<JobStatus>>(
    `/uploads/${jobId}`
  );
  return response.data.data;
}

/**
 * Cancel an upload job
 */
export async function cancelJob(jobId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/uploads/${jobId}`
  );
  return response.data.data;
}
