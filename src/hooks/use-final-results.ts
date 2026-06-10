import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface FinalResult {
  id: string;
  syncedStudentId: string;
  academicYearId: string;
  totalSubjects: number;
  passedSubjects: number;
  failedSubjects: number;
  percentage: number;
  cgpa: number | null;
  overallGrade: string | null;
  classRank: number | null;
  resultStatus: "PENDING" | "PROMOTED" | "FAILED" | "PROBATION" | "WITHHELD";
  isPublished: boolean;
  publishedAt: string | null;
  publishedById: string | null;
  remarks: string | null;
  computedAt: string;
  updatedAt: string;
  syncedStudent?: {
    id: string;
    name: string;
    rollNumber: string;
    grade: string;
    section: string;
  };
  academicYear?: { id: string; name: string };
  _count?: { subjectResults: number };
}

export interface ListFinalResultsFilters {
  academicYearId?: string;
  gradeLevel?: string;
  resultStatus?: "PENDING" | "PROMOTED" | "FAILED" | "PROBATION" | "WITHHELD";
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedFinalResultsResponse {
  results: FinalResult[];
  total: number;
  page: number;
  limit: number;
}

export interface AggregateInput {
  academicYearId: string;
  gradeLevel: string;
  syncedStudentIds?: string[];
}

export interface PublishInput {
  academicYearId: string;
  gradeLevel: string;
  syncedStudentIds?: string[];
  remarks?: string;
}

export function useFinalResults(filters: ListFinalResultsFilters = {}) {
  return useQuery<PaginatedFinalResultsResponse>({
    queryKey: ["final-results", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters.resultStatus) params.set("resultStatus", filters.resultStatus);
      if (filters.isPublished !== undefined) params.set("isPublished", String(filters.isPublished));
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      return apiClient.get(`/admin/final-results?${params.toString()}`);
    },
  });
}

export function useCompileResults() {
  const queryClient = useQueryClient();
  return useMutation<{ studentsProcessed: number; subjectResultsComputed: number }, Error, AggregateInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/aggregation", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
      queryClient.invalidateQueries({ queryKey: ["student-evaluation-results"] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();
  return useMutation<{ published: number }, Error, PublishInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/publish", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-results"] });
    },
  });
}
