import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getPrograms,
  getProgramBySlug,
  getOrganizationPrograms,
  getOrganizationProgramBySlug,
  createProgramApi,
  updateProgramApi,
  deleteProgramApi,
  getProgramReports,
  createProgramReport,
  deleteProgramReportApi,
  type GetProgramsParams,
} from '../api/programs';
import type { ProgramFormData } from '@/lib/schemas/program';

export function usePrograms(params?: GetProgramsParams) {
  return useQuery({
    queryKey: ['programs', params],
    queryFn: () => getPrograms(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProgramBySlug(slug: string) {
  return useQuery({
    queryKey: ['program', slug],
    queryFn: () => getProgramBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Org-scoped list (authenticated) — shows every status for the caller's own
 * organisation, including suspended/archived programmes the public list
 * hides. Use this for "My Programmes" management views.
 */
export function useOrganizationPrograms(
  params?: Omit<GetProgramsParams, 'organisationId'>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['organization-programs', params],
    queryFn: () => getOrganizationPrograms(params),
    enabled: options?.enabled !== false,
    staleTime: 1 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Org-scoped single lookup — 404s if the slug isn't in the caller's own
 * organisation, so another org's programme can never load into a form.
 */
export function useOrganizationProgram(slug: string) {
  return useQuery({
    queryKey: ['organization-program', slug],
    queryFn: () => getOrganizationProgramBySlug(slug),
    enabled: !!slug,
  });
}

export function useProgramReports(slug: string) {
  return useQuery({
    queryKey: ['program-reports', slug],
    queryFn: () => getProgramReports(slug),
    enabled: !!slug,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProgramFormData) => createProgramApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['organization-programs'] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<ProgramFormData> }) =>
      updateProgramApi(slug, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['program', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['organization-programs'] });
      queryClient.invalidateQueries({ queryKey: ['organization-program', variables.slug] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteProgramApi(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['organization-programs'] });
    },
  });
}

export function useCreateProgramReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      data,
    }: {
      slug: string;
      data: { title: string; description: string };
    }) => createProgramReport(slug, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program-reports', variables.slug] });
    },
  });
}

export function useDeleteProgramReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, reportId }: { slug: string; reportId: string }) =>
      deleteProgramReportApi(slug, reportId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['program-reports', variables.slug] });
    },
  });
}
