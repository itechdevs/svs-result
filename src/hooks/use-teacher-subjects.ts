import { useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";

interface TeacherSubject {
  id: string;
  name: string;
  code?: string;
  gradeLevel: string;
  isActive?: boolean;
}

interface UseTeacherSubjectsParams {
  gradeLevel?: string;
}

export function useTeacherSubjects({ gradeLevel }: UseTeacherSubjectsParams = {}) {
  const { data: profile, isLoading } = useProfile();

  const subjects = useMemo(() => {
    if (!profile?.syncedTeacher?.subjects) {
      return [];
    }

    const allSubjects = profile.syncedTeacher.subjects;

    // Filter by grade level if provided
    if (gradeLevel) {
      return allSubjects.filter(
        (subject) => subject.gradeLevel === gradeLevel
      );
    }

    // Return all subjects
    return allSubjects;
  }, [profile, gradeLevel]);

  return {
    subjects,
    isLoading,
    hasSubjects: subjects.length > 0,
  };
}
