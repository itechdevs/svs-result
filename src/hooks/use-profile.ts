import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AssignedSubject {
  id: string;
  name: string;
  gradeLevel: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TEACHER";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  syncedTeacher?: {
    id: string;
    name: string;
    sourceId: string;
    classTeacherId?: string | null;
    classTeacherClassName?: string | null;
    subjects: AssignedSubject[];
  } | null;
}

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      return apiClient.get("/auth/me");
    },
  });
}
