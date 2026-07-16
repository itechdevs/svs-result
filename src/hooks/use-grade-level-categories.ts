import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface GradeLevelCategory {
  id: string;
  gradeLevel: string;
  schoolLevel: "PRE_PRIMARY" | "PRIMARY" | "SECONDARY" | "HIGHER";
  updatedAt: string;
}

export function useGradeLevelCategories() {
  return useQuery<GradeLevelCategory[]>({
    queryKey: ["grade-level-categories"],
    queryFn: async () => apiClient.get("/admin/grade-level-categories"),
  });
}

export function useUpdateGradeLevelCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      mappings: { gradeLevel: string; schoolLevel: string }[],
    ) => {
      return apiClient.patch("/admin/grade-level-categories", { mappings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grade-level-categories"] });
      toast.success("Grade level categories updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update grade level categories");
    },
  });
}
