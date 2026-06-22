import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Exam {
  id: string;
  name: string;
  description: string | null;
  academicYearId: string;
  gradeLevel: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: {
    id: string;
    name: string;
  };
  evaluationTemplates?: Array<{
    id: string;
    syncedSubjectId: string;
    name: string;
    fullMarks: number;
    passMarks: number;
    weightage: number;
    scheduledDate: string | null;
    displayOrder: number;
    isActive: boolean;
    syncedSubject?: {
      id: string;
      name: string;
      code: string;
      gradeLevel: string;
    };
  }>;
  _count?: {
    evaluationTemplates: number;
  };
}

export interface CreateExamInput {
  name: string;
  description?: string;
  academicYearId: string;
  gradeLevel: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface UpdateExamInput {
  name?: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export function useExams(filters?: {
  academicYearId?: string;
  gradeLevel?: string;
  isActive?: boolean;
}) {
  return useQuery<Exam[]>({
    queryKey: ["exams", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.academicYearId) params.set("academicYearId", filters.academicYearId);
      if (filters?.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters?.isActive !== undefined) params.set("isActive", String(filters.isActive));
      return apiClient.get(`/admin/exams?${params.toString()}`);
    },
  });
}

export function useExam(id: string) {
  return useQuery<Exam>({
    queryKey: ["exam", id],
    queryFn: async () => {
      return apiClient.get(`/admin/exams/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation<Exam, Error, CreateExamInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/exams", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation<Exam, Error, { id: string; data: UpdateExamInput }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/admin/exams/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });
}
