import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/types/common';
import type { DatasetInsights } from '@/lib/api/datasets';

export function usePublicDatasetInsights(slug: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dataset-public-insights', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug is required');
      const response = await apiClient.get<ApiResponse<DatasetInsights | null>>(
        `/datasets/public/${slug}/insights`
      );
      return response.data.data;
    },
    enabled: !!slug && enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — insights are recomputed at upload time
    retry: 1,
  });
}
