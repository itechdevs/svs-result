/**
 * useSchoolInformation
 *
 * DB-backed hook for the single-row SchoolInformation configuration.
 * Reads via GET /api/admin/school-information (auto-seeded from
 * SCHOOL_CONFIG on first access). Admin-only mutations:
 *  - update(data)            → PUT
 *  - uploadImage({file,type})→ POST /upload (stores file in public/school/)
 *  - removeImage(type)       → DELETE /upload
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface SchoolInfo {
  id: string;
  schoolName: string;
  shortName: string | null;
  schoolCode: string | null;
  registrationNumber: string | null;
  address: string | null;
  addressFull: string | null;
  municipality: string | null;
  district: string | null;
  province: string | null;
  country: string;
  phone: string | null;
  alternativePhone: string | null;
  email: string | null;
  emailAlt: string | null;
  website: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  principalName: string | null;
  principalContact: string | null;
  principalSignatureUrl: string | null;
  schoolStampUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  reportCardHeader: string | null;
  marksheetHeader: string | null;
  certificateHeader: string | null;
  establishedYear: number | null;
  schoolType: string | null;
  managementType: string | null;
  abbrev: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpdateSchoolInfoInput = Partial<
  Omit<SchoolInfo, "id" | "createdAt" | "updatedAt">
>;

type ImageKind = "logo" | "signature" | "stamp" | "favicon";

const SCHOOL_INFO_ENDPOINT = "/admin/school-information";

async function fetchSchoolInfo(): Promise<SchoolInfo> {
  return apiClient.get(SCHOOL_INFO_ENDPOINT);
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useSchoolInformation() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<SchoolInfo>({
    queryKey: SCHOOL_INFO_QUERY_KEY,
    queryFn: fetchSchoolInfo,
    staleTime: 30 * 1000,
    // Sync other open tabs/pages when they regain focus
    // (the global provider disables this by default)
    refetchOnWindowFocus: true,
  });

  // Write the server response straight into the cache so every mounted
  // consumer (sidebar, navbar, documents) updates instantly.
  const applyResult = (school: SchoolInfo) =>
    queryClient.setQueryData(SCHOOL_INFO_QUERY_KEY, school);

  const update = useMutation<SchoolInfo, Error, UpdateSchoolInfoInput>({
    mutationFn: async (values) => apiClient.put(SCHOOL_INFO_ENDPOINT, values),
    onSuccess: applyResult,
  });

  const uploadImage = useMutation<SchoolInfo, Error, { file: File; type: ImageKind }>({
    mutationFn: async ({ file, type }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      return apiClient.post(`${SCHOOL_INFO_ENDPOINT}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: applyResult,
  });

  const removeImage = useMutation<SchoolInfo, Error, ImageKind>({
    mutationFn: async (type) =>
      apiClient.delete(`${SCHOOL_INFO_ENDPOINT}/upload?type=${type}`),
    onSuccess: applyResult,
  });

  return {
    school: data ?? null,
    isLoading,
    isError,
    update: update.mutateAsync,
    isUpdating: update.isPending,
    uploadImage: async (args: { file: File; type: ImageKind }) => {
      await uploadImage.mutateAsync(args);
      return "";
    },
    isUploading: uploadImage.isPending,
    removeImage: async (type: ImageKind) => {
      await removeImage.mutateAsync(type);
    },
    isRemoving: removeImage.isPending,
  };
}

// ─── Query key ────────────────────────────────────────────────────────────────
export const SCHOOL_INFO_QUERY_KEY = ["school-information"] as const;
