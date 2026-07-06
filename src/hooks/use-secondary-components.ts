import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SecondarySubjectConfig } from "@/types/secondary-marks";

interface UseSecondaryComponentsParams {
  syncedSubjectId?: string;
  academicYearId?: string;
  gradeLevel?: string;
}

export function useSecondaryComponents({
  syncedSubjectId,
  academicYearId,
  gradeLevel,
}: UseSecondaryComponentsParams) {
  return useQuery<SecondarySubjectConfig | null>({
    queryKey: ["secondary-components", syncedSubjectId, academicYearId, gradeLevel],
    queryFn: async () => {
      if (!syncedSubjectId || !academicYearId || !gradeLevel) {
        return null;
      }

      const params = new URLSearchParams({
        academicYearId,
        gradeLevel,
        syncedSubjectId, // Add syncedSubjectId to query params
      });

      console.log('[useSecondaryComponents] Fetching with params:', {
        syncedSubjectId,
        academicYearId,
        gradeLevel,
      });

      const configs: SecondarySubjectConfig[] = await apiClient.get(
        `/admin/secondary/subject-configs?${params.toString()}`
      );

      console.log('[useSecondaryComponents] Received configs:', configs);

      // Since we're filtering by syncedSubjectId in the API, we should get the exact match
      const matchingConfig = configs.find((c) => c.isActive);

      console.log('[useSecondaryComponents] Matching config:', matchingConfig);

      return matchingConfig || null;
    },
    enabled: !!syncedSubjectId && !!academicYearId && !!gradeLevel,
  });
}
