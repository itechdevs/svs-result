import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    gradeConfigs: number;
    finalResults: number;
  };
}

export interface GradeScale {
  id: string;
  gradeConfigId: string;
  minPercent: number;
  maxPercent: number;
  grade: string;
  gradePoint: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GradeConfig {
  id: string;
  academicYearId: string;
  gradeLevel: string;
  gradeType: "LETTER" | "GPA" | "DESCRIPTIVE";
  passCriteria: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: { id: string; name: string };
  gradeScales?: GradeScale[];
  _count?: { evaluationTemplates: number };
}

export interface CreateAcademicYearInput {
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isCurrent?: boolean;
}

export interface CreateGradeConfigInput {
  academicYearId: string;
  gradeLevel: string;
  gradeType?: "LETTER" | "GPA" | "DESCRIPTIVE";
  passCriteria?: string;
}

export function useAcademicYears() {
  return useQuery<AcademicYear[]>({
    queryKey: ["academic-years"],
    queryFn: async () => {
      return apiClient.get("/admin/academic-years");
    },
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation<AcademicYear, Error, CreateAcademicYearInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/academic-years", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

export interface UpdateAcademicYearInput {
  name?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isCurrent?: boolean;
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation<AcademicYear, Error, { id: string; data: UpdateAcademicYearInput }>({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/admin/academic-years/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/academic-years/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
    },
  });
}

export function useGradeConfigs(filters: { academicYearId?: string; gradeLevel?: string } = {}) {
  return useQuery<GradeConfig[]>({
    queryKey: ["grade-configs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      return apiClient.get(`/admin/grade-configs?${params.toString()}`);
    },
  });
}

export function useCreateGradeConfig() {
  const queryClient = useQueryClient();
  return useMutation<GradeConfig, Error, CreateGradeConfigInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/grade-configs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-configs"] });
    },
  });
}
