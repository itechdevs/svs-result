import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SyncedStudent {
  id: string;
  sourceId: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  isActive: boolean;
  syncedAt: string;
  updatedAt: string;
}

export interface ListStudentsFilters {
  class?: string;
  section?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedStudentsResponse {
  students: SyncedStudent[];
  total: number;
  page: number;
  limit: number;
}

export function useStudents(filters: ListStudentsFilters = {}) {
  return useQuery<PaginatedStudentsResponse>({
    queryKey: ["students", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.class) params.set("class", filters.class);
      if (filters.section) params.set("section", filters.section);
      if (filters.search) params.set("search", filters.search);
      if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      return apiClient.get(`/students?${params.toString()}`);
    },
  });
}
