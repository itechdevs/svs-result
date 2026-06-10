import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ReExamSchedule {
  id: string;
  evaluationTemplateId: string;
  scheduledDate: string;
  entryOpenDate: string | null;
  entryCloseDate: string | null;
  fullMarks: number;
  passMarks: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  evaluationTemplate?: {
    id: string;
    name: string;
    syncedSubject: { id: string; name: string };
    gradeConfig: {
      gradeLevel: string;
      academicYear: { name: string };
    };
  };
  _count?: { enrollments: number };
}

export interface ReExamEnrollment {
  id: string;
  reExamScheduleId: string;
  syncedStudentId: string;
  isEligible: boolean;
  createdAt: string;
  syncedStudent?: {
    id: string;
    name: string;
    rollNumber: string;
    grade: string;
    section: string;
  };
  reExamResult?: ReExamResult | null;
}

export interface ReExamResult {
  id: string;
  reExamEnrollmentId: string;
  studentEvaluationResultId: string;
  enteredById: string;
  marksObtained: number;
  isPassed: boolean;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";
  verifiedById: string | null;
  verifiedAt: string | null;
  remarks: string | null;
}

export interface CreateReExamScheduleInput {
  evaluationTemplateId: string;
  scheduledDate: Date | string;
  entryOpenDate?: Date | string;
  entryCloseDate?: Date | string;
  fullMarks: number;
  passMarks: number;
  remarks?: string;
}

export interface UpdateReExamScheduleInput {
  scheduledDate?: Date | string;
  entryOpenDate?: Date | string;
  entryCloseDate?: Date | string;
  fullMarks?: number;
  passMarks?: number;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  remarks?: string;
}

export interface EnrollStudentsInput {
  syncedStudentIds: string[];
}

export interface UpsertReExamResultInput {
  reExamEnrollmentId: string;
  marksObtained: number;
  remarks?: string;
}

export function useReExamSchedules(status?: "SCHEDULED" | "COMPLETED" | "CANCELLED") {
  return useQuery<ReExamSchedule[]>({
    queryKey: ["re-exam-schedules", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      return apiClient.get(`/admin/re-exam-schedules?${params.toString()}`);
    },
  });
}

export function useReExamSchedule(id: string) {
  return useQuery<ReExamSchedule>({
    queryKey: ["re-exam-schedule", id],
    queryFn: async () => {
      return apiClient.get(`/admin/re-exam-schedules/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateReExamSchedule() {
  const queryClient = useQueryClient();
  return useMutation<ReExamSchedule, Error, CreateReExamScheduleInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/re-exam-schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedules"] });
    },
  });
}

export function useUpdateReExamSchedule(id: string) {
  const queryClient = useQueryClient();
  return useMutation<ReExamSchedule, Error, UpdateReExamScheduleInput>({
    mutationFn: async (data) => {
      return apiClient.patch(`/admin/re-exam-schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedule", id] });
    },
  });
}

export function useReExamEnrollments(scheduleId: string) {
  return useQuery<ReExamEnrollment[]>({
    queryKey: ["re-exam-enrollments", scheduleId],
    queryFn: async () => {
      return apiClient.get(`/admin/re-exam-schedules/${scheduleId}/enrollments`);
    },
    enabled: !!scheduleId,
  });
}

export function useEnrollStudents(scheduleId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ count: number }, Error, EnrollStudentsInput>({
    mutationFn: async (data) => {
      return apiClient.post(`/admin/re-exam-schedules/${scheduleId}/enrollments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["re-exam-enrollments", scheduleId] });
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedules"] });
    },
  });
}

export function useSaveReExamResult(scheduleId: string) {
  const queryClient = useQueryClient();
  return useMutation<ReExamResult, Error, UpsertReExamResultInput>({
    mutationFn: async (data) => {
      return apiClient.post(`/admin/re-exam-schedules/${scheduleId}/results`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["re-exam-enrollments", scheduleId] });
    },
  });
}

export function useCompleteReExam() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string }, Error, string>({
    mutationFn: async (id) => {
      return apiClient.post(`/admin/re-exam-schedules/${id}/complete`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["re-exam-schedule", id] });
    },
  });
}
