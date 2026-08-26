import { useQuery } from '@tanstack/react-query';
import { getGroups, getGroupBySlug, type GetGroupsParams } from '../api/groups';

export function useGroups(params?: GetGroupsParams) {
  return useQuery({
    queryKey: ['groups', params],
    queryFn: () => getGroups(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupBySlug(slug: string) {
  return useQuery({
    queryKey: ['group', slug],
    queryFn: () => getGroupBySlug(slug),
    enabled: !!slug,
  });
}
