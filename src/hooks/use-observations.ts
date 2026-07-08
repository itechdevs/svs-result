import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObservationItem {
  id: string;
  observationCategoryId: string;
  description: string;
  choices: string[] | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationCategory {
  id: string;
  title: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  items?: ObservationItem[];
}

export interface CreateObservationCategoryInput {
  title: string;
  displayOrder?: number;
}

export interface UpdateObservationCategoryInput {
  title?: string;
  displayOrder?: number;
}

export interface CreateObservationItemInput {
  description: string;
  displayOrder?: number;
  choices?: string[];
}

export interface UpdateObservationItemInput {
  description?: string;
  displayOrder?: number;
  choices?: string[];
}

// ─── Category hooks ───────────────────────────────────────────────────────────

export function useObservationCategories(includeItems = true) {
  return useQuery<ObservationCategory[]>({
    queryKey: ["observation-categories", { includeItems }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeItems) params.set("includeItems", "true");
      return apiClient.get(`/admin/observations/categories?${params.toString()}`);
    },
  });
}

export function useObservationCategory(id: string) {
  return useQuery<ObservationCategory>({
    queryKey: ["observation-category", id],
    queryFn: async () => {
      return apiClient.get(`/admin/observations/categories/${id}`);
    },
    enabled: !!id,
  });
}

export function useCreateObservationCategory() {
  const queryClient = useQueryClient();
  return useMutation<ObservationCategory, Error, CreateObservationCategoryInput>({
    mutationFn: async (data) => {
      return apiClient.post("/admin/observations/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
    },
  });
}

export function useUpdateObservationCategory() {
  const queryClient = useQueryClient();
  return useMutation<
    ObservationCategory,
    Error,
    { id: string; data: UpdateObservationCategoryInput }
  >({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/admin/observations/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
    },
  });
}

export function useDeleteObservationCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/observations/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
    },
  });
}

// ─── Item hooks ───────────────────────────────────────────────────────────────

export function useObservationItems(categoryId: string) {
  return useQuery<ObservationItem[]>({
    queryKey: ["observation-items", categoryId],
    queryFn: async () => {
      return apiClient.get(
        `/admin/observations/categories/${categoryId}/items`
      );
    },
    enabled: !!categoryId,
  });
}

export function useCreateObservationItem(categoryId: string) {
  const queryClient = useQueryClient();
  return useMutation<ObservationItem, Error, CreateObservationItemInput>({
    mutationFn: async (data) => {
      return apiClient.post(
        `/admin/observations/categories/${categoryId}/items`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["observation-items", categoryId],
      });
    },
  });
}

export function useUpdateObservationItem() {
  const queryClient = useQueryClient();
  return useMutation<
    ObservationItem,
    Error,
    { id: string; data: UpdateObservationItemInput }
  >({
    mutationFn: async ({ id, data }) => {
      return apiClient.patch(`/admin/observations/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
    },
  });
}

export function useDeleteObservationItem() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      return apiClient.delete(`/admin/observations/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observation-categories"] });
    },
  });
}
