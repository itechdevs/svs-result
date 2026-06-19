import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TeacherSubjectCompilationResult {
  id: string;
  compilationId: string;
  syncedStudentId: string;
  totalFullMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string | null;
  gradePoint: number | null;
  isPassed: boolean;
  failedEvaluations: number;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    rollNumber: string;
    grade: string;
    section: string;
  };
}

export interface TeacherSubjectCompilation {
  id: string;
  teacherId: string;
  syncedSubjectId: string;
  academicYearId: string;
  gradeLevel: string;
  evaluationTemplateIds: string[];
  status: "DRAFT" | "SUBMITTED";
  submittedAt: string | null;
  computedAt: string;
  createdAt: string;
  updatedAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
    gradeLevel: string;
  };
  academicYear: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  results: TeacherSubjectCompilationResult[];
}

export interface ListTeacherCompilationsFilters {
  syncedSubjectId?: string;
  academicYearId?: string;
  gradeLevel?: string;
  status?: "DRAFT" | "SUBMITTED";
}

export interface CreateTeacherCompilationInput {
  syncedSubjectId: string;
  academicYearId: string;
  gradeLevel: string;
  evaluationTemplateIds: string[];
}

export function useTeacherSubjectCompilations(
  filters: ListTeacherCompilationsFilters = {}
) {
  return useQuery<TeacherSubjectCompilation[]>({
    queryKey: ["teacher-subject-compilations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.syncedSubjectId) params.set("syncedSubjectId", filters.syncedSubjectId);
      if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters.status) params.set("status", filters.status);
      return apiClient.get(`/teacher/subject-compilations?${params.toString()}`);
    },
  });
}

export function useCreateTeacherCompilation() {
  const queryClient = useQueryClient();
  return useMutation<TeacherSubjectCompilation, Error, CreateTeacherCompilationInput>({
    mutationFn: async (data) => {
      return apiClient.post("/teacher/subject-compilations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-subject-compilations"] });
    },
  });
}

export function useSubmitTeacherCompilation() {
  const queryClient = useQueryClient();
  return useMutation<TeacherSubjectCompilation, Error, string>({
    mutationFn: async (id) => {
      return apiClient.post(`/teacher/subject-compilations/${id}/submit`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-subject-compilations"] });
    },
  });
}

export function useAdminTeacherCompilations(
  filters: ListTeacherCompilationsFilters = {}
) {
  return useQuery<TeacherSubjectCompilation[]>({
    queryKey: ["admin-teacher-compilations", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.syncedSubjectId) params.set("syncedSubjectId", filters.syncedSubjectId);
      if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters.status) params.set("status", filters.status);
      return apiClient.get(`/admin/teacher-compilations?${params.toString()}`);
    },
  });
}
