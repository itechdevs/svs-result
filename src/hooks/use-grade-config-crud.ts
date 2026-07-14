import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type { GradeConfig, GradeScale } from "@/hooks/use-academic-config";

export function useUpdateGradeConfig() {
  const queryClient = useQueryClient();
  return useMutation<
    GradeConfig,
    Error,
    { id: string; data: { gradeType?: string; passCriteria?: string | null; isActive?: boolean } }
  >({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/admin/grade-configs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-configs"] });
      toast.success("Grade config updated");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update grade config");
    },
  });
}

export function useDeleteGradeConfig() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/grade-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-configs"] });
      toast.success("Grade config deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete grade config");
    },
  });
}

export function useUpsertGradeScales() {
  const queryClient = useQueryClient();
  return useMutation<
    GradeScale[],
    Error,
    {
      gradeConfigId: string;
      scales: {
        minPercent: number;
        maxPercent: number;
        grade: string;
        gradePoint?: number;
        description?: string;
      }[];
    }
  >({
    mutationFn: async ({ gradeConfigId, scales }) => {
      return apiClient.post(
        `/admin/grade-configs/${gradeConfigId}/grade-scales`,
        { scales },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-configs"] });
      toast.success("Grade scales saved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save grade scales");
    },
  });
}

export function useDeleteGradeScale() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { gradeConfigId: string; scaleId: string }
  >({
    mutationFn: async ({ gradeConfigId, scaleId }) => {
      return apiClient.delete(
        `/admin/grade-configs/${gradeConfigId}/grade-scales/${scaleId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-configs"] });
      toast.success("Grade scale removed");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove grade scale");
    },
  });
}
