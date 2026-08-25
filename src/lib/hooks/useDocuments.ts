import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  getDocumentBySlug,
  getOrgDocuments,
  getOrgDocumentBySlug,
  downloadDocument,
  createOrgDocument,
  updateOrgDocument,
  submitDocumentForReview,
  type GetDocumentsParams,
  type CreateOrgDocumentPayload,
} from '../api/documents';

export function useDocuments(params?: GetDocumentsParams) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => getDocuments(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrgDocuments(
  params?: GetDocumentsParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['org-documents', params],
    queryFn: () => getOrgDocuments(params),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

export function useDocumentBySlug(slug: string) {
  return useQuery({
    queryKey: ['document', slug],
    queryFn: () => getDocumentBySlug(slug),
    enabled: !!slug,
  });
}

export function useOrgDocumentBySlug(slug: string) {
  return useQuery({
    queryKey: ['org-document', slug],
    queryFn: () => getOrgDocumentBySlug(slug),
    enabled: !!slug,
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: (slug: string) => downloadDocument(slug),
  });
}

export function useCreateOrgDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrgDocumentPayload) => createOrgDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-documents'] });
    },
  });
}

export function useUpdateOrgDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      data,
    }: {
      slug: string;
      data: Partial<CreateOrgDocumentPayload>;
    }) => updateOrgDocument(slug, data),
    onSuccess: (_doc, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org-documents'] });
      queryClient.invalidateQueries({ queryKey: ['org-document', vars.slug] });
    },
  });
}

export function useSubmitDocumentForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => submitDocumentForReview(slug),
    onSuccess: (_doc, slug) => {
      queryClient.invalidateQueries({ queryKey: ['org-documents'] });
      queryClient.invalidateQueries({ queryKey: ['org-document', slug] });
    },
  });
}
