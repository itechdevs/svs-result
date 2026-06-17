import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Types matching the Prisma model fields and include relations
export interface EvaluationTemplate {
  id: string;
  gradeConfigId: string;
  syncedSubjectId: string;
  name: string;
  fullMarks: number;
  passMarks: number;
  weightage: number;
  scheduledDate?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  gradeConfig?: {
    id: string;
    gradeLevel: string;
    academicYear: { id: string; name: string };
  };
  syncedSubject?: {
    id: string;
    name: string;
    code: string;
    gradeLevel: string;
  };
}

export interface StudentEvaluationResult {
  id: string;
  syncedStudentId: string;
  evaluationTemplateId: string;
  enteredById: string;
  marksObtained: number | null;
  isAbsent: boolean;
  isPassed: boolean | null;
  effectiveMarks: number | null;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";
  submittedAt: string | null;
  verifiedById: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  syncedStudent?: {
    id: string;
    name: string;
    rollNumber: string;
    grade: string;
    section: string;
  };
  evaluationTemplate?: {
    id: string;
    name: string;
    fullMarks: number;
    passMarks: number;
    weightage: number;
  };
  enteredBy?: { id: string; name: string };
  verifiedBy?: { id: string; name: string } | null;
}

export interface ListTemplatesFilters {
  gradeConfigId?: string;
  syncedSubjectId?: string;
  isActive?: boolean;
}

export interface ListResultsFilters {
  evaluationTemplateId?: string;
  syncedStudentId?: string;
  status?: "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";
  page?: number;
  limit?: number;
}

export interface CreateTemplateInput {
  gradeConfigId: string;
  syncedSubjectId: string;
  name: string;
  fullMarks: number;
  passMarks: number;
  weightage: number;
  scheduledDate?: Date | string;
  displayOrder?: number;
}

export interface UpdateTemplateInput {
  name?: string;
  fullMarks?: number;
  passMarks?: number;
  weightage?: number;
  scheduledDate?: Date | string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface BulkSaveResultItem {
  syncedStudentId: string;
  marksObtained?: number;
  isAbsent: boolean;
  remarks?: string;
}

export interface BulkSaveResultsInput {
  evaluationTemplateId: string;
  results: BulkSaveResultItem[];
}

// ─── Evaluation Template Hooks ────────────────────────────────────────────────

export function useEvaluationTemplates(filters: ListTemplatesFilters = {}) {
  return useQuery<EvaluationTemplate[]>({
    queryKey: ["evaluation-templates", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.gradeConfigId) params.set("gradeConfigId", filters.gradeConfigId);
      if (filters.syncedSubjectId) params.set("syncedSubjectId", filters.syncedSubjectId);
      if (filters.isActive !== undefined) params.set("isActive", String(filters.isActive));
      return apiClient.get(`/admin/evaluation-templates?${params.toString()}`);
    },
  });
}

export function useEvaluationTemplate(id: string) {
  return useQuery<EvaluationTemplate>({
    queryKey: ["evaluation-template", id],
    queryFn: async () => {
      return apiClient.get(`/admin/evaluation-templates/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateEvaluationTemplate() {
  const queryClient = useQueryClient();
  return useMutation<EvaluationTemplate, Error, CreateTemplateInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/evaluation-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
    },
  });
}

export function useUpdateEvaluationTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation<EvaluationTemplate, Error, UpdateTemplateInput>({
    mutationFn: async (data) => {
      return apiClient.patch(`/admin/evaluation-templates/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-template", id] });
    },
  });
}

export function useDeleteEvaluationTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/evaluation-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
    },
  });
}

// ─── Evaluation Results Hooks ──────────────────────────────────────────────────

export function useStudentEvaluationResults(filters: ListResultsFilters = {}) {
  return useQuery<StudentEvaluationResult[]>({
    queryKey: ["student-evaluation-results", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.evaluationTemplateId) params.set("evaluationTemplateId", filters.evaluationTemplateId);
      if (filters.syncedStudentId) params.set("syncedStudentId", filters.syncedStudentId);
      if (filters.status) params.set("status", filters.status);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      return apiClient.get(`/evaluations?${params.toString()}`);
    },
  });
}

export interface CreateTeacherEvaluationPlanInput {
  syncedSubjectId: string;
  gradeLevel: string;
  name: string;
  fullMarks: number;
  passMarks: number;
  weightage: number;
  scheduledDate?: string;
  displayOrder?: number;
}

export function useCreateTeacherEvaluationPlan() {
  const queryClient = useQueryClient();
  return useMutation<EvaluationTemplate, Error, CreateTeacherEvaluationPlanInput>({
    mutationFn: (data) => apiClient.post("/teacher/evaluation-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-templates"] });
    },
  });
}

export function useBulkSaveMarks() {
  const queryClient = useQueryClient();
  return useMutation<{ count: number }, Error, BulkSaveResultsInput>({
    mutationFn: async (data) => {
      return apiClient.post("/evaluations", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student-evaluation-results"] });
    },
  });
}

export function useSubmitResult() {
  const queryClient = useQueryClient();
  return useMutation<StudentEvaluationResult, Error, string>({
    mutationFn: async (id) => {
      return apiClient.post(`/evaluations/${id}/submit`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-evaluation-results"] });
    },
  });
}

export function useVerifyResult() {
  const queryClient = useQueryClient();
  return useMutation<StudentEvaluationResult, Error, { id: string; remarks?: string }>({
    mutationFn: async ({ id, remarks }) => {
      return apiClient.post(`/evaluations/${id}/verify`, { remarks });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-evaluation-results"] });
    },
  });
}
