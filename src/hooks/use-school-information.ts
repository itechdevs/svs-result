/**
 * useSchoolInformation
 *
 * File-based configuration hook.
 * Returns school information directly from src/constants/index.ts (SCHOOL_CONFIG).
 * No database or API calls — update the constants file and redeploy to change values.
 */

"use client";

import { SCHOOL_CONFIG } from "@/constants";

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

// ─── Static school data built from SCHOOL_CONFIG ───────────────────────────────
const SCHOOL_INFO_FROM_CONFIG: SchoolInfo = {
  id: "file-config",
  schoolName: SCHOOL_CONFIG.name,
  shortName: SCHOOL_CONFIG.nameShort,
  schoolCode: null,
  registrationNumber: null,
  address: SCHOOL_CONFIG.address,
  addressFull: SCHOOL_CONFIG.addressFull,
  municipality: null,
  district: null,
  province: null,
  country: "Nepal",
  phone: SCHOOL_CONFIG.phone,
  alternativePhone: null,
  email: SCHOOL_CONFIG.email,
  emailAlt: SCHOOL_CONFIG.emailAlt,
  website: SCHOOL_CONFIG.website,
  logoUrl: SCHOOL_CONFIG.logo,
  faviconUrl: null,
  principalName: null,
  principalContact: null,
  principalSignatureUrl: null,
  schoolStampUrl: null,
  headerText: null,
  footerText: null,
  reportCardHeader: null,
  marksheetHeader: null,
  certificateHeader: null,
  establishedYear: null,
  schoolType: null,
  managementType: null,
  abbrev: SCHOOL_CONFIG.abbrev,
  updatedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useSchoolInformation() {
  return {
    school: SCHOOL_INFO_FROM_CONFIG,
    isLoading: false,
    isError: false,
    // No-op stubs — kept for API compatibility so no other file needs to change
    update: async (_data: UpdateSchoolInfoInput) => SCHOOL_INFO_FROM_CONFIG,
    isUpdating: false,
    uploadImage: async (_args: { file: File; type: "logo" | "signature" | "stamp" | "favicon" }) => SCHOOL_CONFIG.logo,
    isUploading: false,
    removeImage: async (_type: "logo" | "signature" | "stamp" | "favicon") => { },
    isRemoving: false,
  };
}

// ─── Query key (kept for compatibility) ────────────────────────────────────────
export const SCHOOL_INFO_QUERY_KEY = ["school-information"] as const;
