import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type {
  SecondaryPracticalHeading,
  SecondaryPracticalHeadingMark,
  PracticalHeadingMarkInput,
} from "@/types/secondary-marks";

interface PracticalMarkEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  section: string;
  isAbsent: boolean;
  headingMarks: Record<string, number | null>;
  totalMarks: number;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";
  hasUnsavedChanges: boolean;
  validationError: string | null;
}

interface UsePracticalMarkEntryParams {
  componentId: string;
  examId: string;
  practicalHeadings: SecondaryPracticalHeading[];
  students: Array<{
    id: string;
    name: string;
    rollNumber: string;
    section: string;
  }>;
}

export function usePracticalMarkEntry({
  componentId,
  examId,
  practicalHeadings,
  students,
}: UsePracticalMarkEntryParams) {
  const queryClient = useQueryClient();

  // Local state for unsaved changes
  const [localChanges, setLocalChanges] = useState<Record<string, Record<string, number | null>>>({});
  const [absentStatus, setAbsentStatus] = useState<Record<string, boolean>>({});

  // Fetch existing practical marks from DB
  const { data: existingMarks = [], isLoading } = useQuery<SecondaryPracticalHeadingMark[]>({
    queryKey: ["practical-marks", componentId, examId],
    queryFn: async () => {
      if (!componentId || !examId) return [];

      const params = new URLSearchParams({
        componentId,
        examId,
      });

      return apiClient.get(`/teacher/secondary/practical-marks?${params.toString()}`);
    },
    enabled: !!componentId && !!examId,
  });

  // Group existing marks by student
  const existingMarksByStudent = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    existingMarks.forEach((mark) => {
      if (!map[mark.syncedStudentId]) {
        map[mark.syncedStudentId] = {};
      }
      map[mark.syncedStudentId][mark.headingId] = Number(mark.marksObtained);
    });
    return map;
  }, [existingMarks]);

  // Calculate total marks for a student
  const calculateTotal = useCallback((studentId: string): number => {
    const studentChanges = localChanges[studentId] || {};
    const studentExisting = existingMarksByStudent[studentId] || {};

    let total = 0;
    practicalHeadings.forEach((heading) => {
      const marks = studentChanges[heading.id] ?? studentExisting[heading.id] ?? 0;
      total += marks || 0;
    });

    return total;
  }, [localChanges, existingMarksByStudent, practicalHeadings]);

  // Build display rows
  const practicalMarkEntryRows = useMemo<PracticalMarkEntry[]>(() => {
    return students.map((student) => {
      const studentChanges = localChanges[student.id] || {};
      const studentExisting = existingMarksByStudent[student.id] || {};
      const isAbsent = absentStatus[student.id] || false;
      const hasChanges = Object.keys(studentChanges).length > 0 || absentStatus[student.id] !== undefined;

      const headingMarks: Record<string, number | null> = {};
      practicalHeadings.forEach((heading) => {
        headingMarks[heading.id] = studentChanges[heading.id] ?? studentExisting[heading.id] ?? null;
      });

      const totalMarks = isAbsent ? 0 : calculateTotal(student.id);

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        section: student.section,
        isAbsent,
        headingMarks,
        totalMarks,
        status: "DRAFT", // TODO: Get actual status from component marks
        hasUnsavedChanges: hasChanges,
        validationError: null,
      };
    });
  }, [students, localChanges, existingMarksByStudent, absentStatus, practicalHeadings, calculateTotal]);

  // Update heading mark
  const updateHeadingMark = useCallback((studentId: string, headingId: string, marks: number | null) => {
    setLocalChanges((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [headingId]: marks,
      },
    }));
  }, []);

  // Update absent status
  const updateAbsent = useCallback((studentId: string, isAbsent: boolean) => {
    setAbsentStatus((prev) => ({
      ...prev,
      [studentId]: isAbsent,
    }));

    // If marking as absent, clear all marks
    if (isAbsent) {
      setLocalChanges((prev) => ({
        ...prev,
        [studentId]: {},
      }));
    }
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (marks: PracticalHeadingMarkInput[]) => {
      return apiClient.post("/teacher/secondary/practical-marks", {
        componentId,
        examId,
        marks,
      });
    },
    onSuccess: () => {
      // Clear local changes
      setLocalChanges({});
      setAbsentStatus({});

      // Refetch marks
      queryClient.invalidateQueries({ queryKey: ["practical-marks", componentId, examId] });

      toast.success("Practical marks saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save practical marks");
    },
  });

  // Save all local changes
  const saveAll = useCallback(async () => {
    const marksToSave: PracticalHeadingMarkInput[] = [];

    // Convert local changes to API format
    Object.entries(localChanges).forEach(([studentId, headings]) => {
      Object.entries(headings).forEach(([headingId, marks]) => {
        if (marks !== null && marks !== undefined) {
          marksToSave.push({
            syncedStudentId: studentId,
            headingId,
            marksObtained: marks,
          });
        }
      });
    });

    // Handle absent students (save zero marks for all headings)
    Object.entries(absentStatus).forEach(([studentId, isAbsent]) => {
      if (isAbsent) {
        practicalHeadings.forEach((heading) => {
          marksToSave.push({
            syncedStudentId: studentId,
            headingId: heading.id,
            marksObtained: 0,
          });
        });
      }
    });

    if (marksToSave.length === 0) {
      toast.info("No changes to save");
      return;
    }

    await saveMutation.mutateAsync(marksToSave);
  }, [localChanges, absentStatus, practicalHeadings, componentId, examId, saveMutation]);

  // Submit mutation (placeholder - would need to implement component mark submission)
  const submitMutation = useMutation({
    mutationFn: async () => {
      // First save any pending changes
      if (Object.keys(localChanges).length > 0 || Object.keys(absentStatus).length > 0) {
        await saveAll();
      }

      // TODO: Implement submission logic for practical marks
      toast.info("Submission for practical marks coming soon");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practical-marks", componentId, examId] });
    },
  });

  const submitAll = useCallback(async () => {
    await submitMutation.mutateAsync();
  }, [submitMutation]);

  return {
    practicalMarkEntryRows,
    isLoading,
    updateHeadingMark,
    updateAbsent,
    saveAll,
    submitAll,
    isSaving: saveMutation.isPending,
    isSubmitting: submitMutation.isPending,
    hasUnsavedChanges: Object.keys(localChanges).length > 0 || Object.keys(absentStatus).length > 0,
  };
}
