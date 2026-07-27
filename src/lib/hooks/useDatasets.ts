import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getDatasets,
  getOrganizationDatasets,
  getDatasetBySlug,
  getOrganizationDatasetBySlug,
  createDataset,
  updateDataset,
  deleteDataset,
  submitDatasetForReview,
  downloadDataset,
  getDatasetFiles,
  getDatasetVersions,
  getDatasetPreview,
  type DatasetListParams,
  type CreateDatasetDto,
  type UpdateDatasetDto,
} from '../api/datasets';

/**
 * Hook to fetch datasets with filters and pagination
 */
export function useDatasets(params?: DatasetListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['datasets', params],
    queryFn: () => getDatasets(params),
    enabled: options?.enabled !== false, // Default to true, can be disabled
    staleTime: 2 * 60 * 1000, // 2 minutes - datasets change frequently
  });
}

/**
 * Hook to fetch organization datasets (authenticated, shows all statuses)
 * Use this in "My Datasets" page to show org's drafts, pending, etc.
 */
export function useOrganizationDatasets(params?: Omit<DatasetListParams, 'organisationId'>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['organization-datasets', params],
    queryFn: () => getOrganizationDatasets(params),
    enabled: options?.enabled !== false,
    staleTime: 1 * 60 * 1000, // 1 minute - org datasets change frequently
    // Keep showing the previous filter's rows while the new one loads,
    // instead of unmounting straight to a loading skeleton — switching
    // status tabs shouldn't collapse the page height and jump the scroll
    // position on every click.
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to fetch a single dataset by slug (public endpoint)
 */
export function useDataset(slug: string) {
  return useQuery({
    queryKey: ['dataset', slug],
    queryFn: () => getDatasetBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single organization dataset by slug (authenticated endpoint)
 * Use this when authenticated users view their own organization's datasets
 */
export function useOrganizationDataset(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['organization-dataset', slug],
    queryFn: () => getOrganizationDatasetBySlug(slug),
    enabled: !!slug && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - org datasets change frequently
  });
}

/**
 * Hook to create a new dataset
 */
export function useCreateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatasetDto) => createDataset(data),
    onSuccess: () => {
      // Invalidate both datasets lists to refetch
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['organization-datasets'] });
    },
  });
}

/**
 * Hook to update a dataset
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateDatasetDto }) =>
      updateDataset(slug, data),
    onSuccess: (_, variables) => {
      // Invalidate specific dataset and both lists
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['organization-datasets'] });
    },
  });
}

/**
 * Hook to delete a dataset
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteDataset(slug),
    onSuccess: () => {
      // Invalidate both datasets lists
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['organization-datasets'] });
    },
  });
}

/**
 * Hook to submit a dataset for review (draft/rejected → pending)
 */
export function useSubmitDatasetForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => submitDatasetForReview(slug),
    onSuccess: (_, slug) => {
      // Invalidate specific dataset to show updated status
      queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      queryClient.invalidateQueries({ queryKey: ['organization-datasets'] });
    },
  });
}

/**
 * Hook to download a dataset
 */
export function useDownloadDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      mode,
      fileId,
    }: {
      slug: string;
      mode?: 'download' | 'view';
      fileId?: string;
    }) => downloadDataset(slug, mode, fileId),
    onSuccess: (_, { slug, mode }) => {
      // Only the download_count changes server-side; skip for view-mode opens
      if (mode !== 'view') {
        queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
      }
    },
  });
}

/**
 * Hook to fetch every file uploaded to a dataset (a dataset can receive
 * more than one upload over time)
 */
export function useDatasetFiles(slug: string) {
  return useQuery({
    queryKey: ['dataset-files', slug],
    queryFn: () => getDatasetFiles(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch dataset version history
 */
export function useDatasetVersions(slug: string) {
  return useQuery({
    queryKey: ['dataset-versions', slug],
    queryFn: () => getDatasetVersions(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch dataset preview
 */
export function useDatasetPreview(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dataset-preview', slug],
    queryFn: () => getDatasetPreview(slug),
    enabled: !!slug && enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - previews are cached
  });
}
