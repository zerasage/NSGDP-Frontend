import { useQuery } from "@tanstack/react-query";
import { getStateBoundary } from "@/lib/api/gis";

export function useStateBoundary() {
  return useQuery({
    queryKey: ["gis", "state-boundary"],
    queryFn: getStateBoundary,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
