import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ClassPerformance {
  grade: string;
  averageGpa: number;
  studentCount: number;
}

export interface AdminDashboardData {
  academicYear: { id: string; name: string };
  students: { total: number };
  teachers: { total: number };
  results: {
    byStatus: Record<string, number>;
    passCount: number;
    failCount: number;
    totalCount: number;
    passPercentage: number;
    failPercentage: number;
    published: number;
    marksheetsGenerated: number;
  };
  evaluations: {
    pendingSubmission: number;
    pendingVerification: number;
  };
  reExams: {
    total: number;
    byStatus: Record<string, number>;
  };
  classPerformance: ClassPerformance[];
}

export function useAdminDashboard(academicYearId?: string) {
  return useQuery<AdminDashboardData>({
    queryKey: ["admin-dashboard", { academicYearId }],
    queryFn: async () => {
      const params = academicYearId ? `?academicYearId=${academicYearId}` : "";
      return apiClient.get(`/admin/dashboard${params}`);
    },
  });
}
