import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getDocuments,
  getDocumentBySlug,
  downloadDocument,
  type GetDocumentsParams,
} from '../api/documents';

// Org-dashboard document hooks live in `use-org-documents.ts` so the
// public catalogue hooks stay a thin client-safe module without mixing
// contribution workflow exports into the shared library surface.

export function useDocuments(params?: GetDocumentsParams) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => getDocuments(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDocumentBySlug(slug: string) {
  return useQuery({
    queryKey: ['document', slug],
    queryFn: () => getDocumentBySlug(slug),
    enabled: !!slug,
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: (slug: string) => downloadDocument(slug),
  });
}
