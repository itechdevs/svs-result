import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SyncedSubject {
  id: string;
  sourceId: string;
  name: string;
  code: string;
  gradeLevel: string;
  isActive: boolean;
  syncedAt: string;
  updatedAt: string;
}

export interface ListSubjectsFilters {
  gradeLevel?: string;
  isActive?: boolean;
  search?: string;
}

export function useSubjects(filters: ListSubjectsFilters = {}) {
  return useQuery<SyncedSubject[]>({
    queryKey: ["subjects", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
      if (filters.search) params.set("search", filters.search);
      return apiClient.get(`/subjects?${params.toString()}`);
    },
  });
}

export function useGradeLevels() {
  return useQuery<string[]>({
    queryKey: ["grade-levels"],
    queryFn: async () => {
      return apiClient.get("/subjects/grade-levels");
    },
  });
}
