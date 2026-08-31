import { useQuery } from '@tanstack/react-query';
import { getLgaGisSummary, lgaOptionsFromSummary, type LgaOption } from '@/lib/api/gis';
import { NIGER_STATE_LGAS } from '@/lib/constants/core';

const QUERY_KEY = ['gis', 'lga-options'];

function fallbackLgaOptions(): LgaOption[] {
  return NIGER_STATE_LGAS.map((name) => ({ name, code: null }));
}

export function useLgaOptions() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const summary = await getLgaGisSummary();
        const options = lgaOptionsFromSummary(summary);
        return options.length > 0 ? options : fallbackLgaOptions();
      } catch {
        return fallbackLgaOptions();
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  return {
    options: query.data ?? fallbackLgaOptions(),
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
