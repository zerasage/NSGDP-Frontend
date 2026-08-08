import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPrograms,
  getProgramBySlug,
  createProgramApi,
  updateProgramApi,
  deleteProgramApi,
  getProgramReports,
  createProgramReport,
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
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteProgramApi(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
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
