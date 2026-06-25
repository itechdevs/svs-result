import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface TeacherAssignment {
  id: string;
  userId: string;
  gradeLevel: string;
  syncedSubjectId: string | null;
  academicYearId: string;
  assignedBy: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
}

export interface ListAssignmentsFilters {
  userId?: string;
  gradeLevel?: string;
  academicYearId?: string;
}

export interface CreateAssignmentInput {
  userId: string;
  gradeLevel: string;
  syncedSubjectId?: string;
  academicYearId: string;
}

export function useTeacherAssignments(filters: ListAssignmentsFilters = {}) {
  return useQuery<TeacherAssignment[]>({
    queryKey: ["teacher-assignments", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.gradeLevel) params.set("gradeLevel", filters.gradeLevel);
      if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
      return apiClient.get(`/admin/teacher-assignments?${params.toString()}`);
    },
  });
}

export interface SyncedAllocationTeacher {
  id: string;
  name: string;
  syncedAt: string;
  hasAccount: boolean;
  subjects: { id: string; name: string; gradeLevel: string }[];
}

export function useSyncedAllocations() {
  return useQuery<SyncedAllocationTeacher[]>({
    queryKey: ['synced-allocations'],
    queryFn: async () => {
      const res = await fetch('/api/allocations/synced');
      if (!res.ok) throw new Error('Failed to fetch allocations');
      const data = await res.json();
      return data.allocations ?? [];
    },
  });
}

export function useCreateTeacherAssignment() {
  const queryClient = useQueryClient();
  return useMutation<TeacherAssignment, Error, CreateAssignmentInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/teacher-assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
  });
}
