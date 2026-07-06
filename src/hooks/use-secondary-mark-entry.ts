import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import type {
  SecondaryComponentMark,
  StudentMarkInput,
  MarkEntryRow,
  MarksEntryStats,
} from "@/types/secondary-marks";

interface UseSecondaryMarkEntryParams {
  componentId: string;
  examId: string;
  students: Array<{
    id: string;
    name: string;
    rollNumber: string;
    section: string;
  }>;
}

export function useSecondaryMarkEntry({
  componentId,
  examId,
  students,
}: UseSecondaryMarkEntryParams) {
  const queryClient = useQueryClient();
  
  // Local state for unsaved changes
  const [localChanges, setLocalChanges] = useState<Record<string, StudentMarkInput>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch existing marks from DB
  const { data: existingMarks = [], isLoading } = useQuery<SecondaryComponentMark[]>({
    queryKey: ["secondary-marks", componentId, examId],
    queryFn: async () => {
      if (!componentId || !examId) return [];
      
      const params = new URLSearchParams({
        componentId,
        examId,
      });
      
      return apiClient.get(`/teacher/secondary/marks?${params.toString()}`);
    },
    enabled: !!componentId && !!examId,
  });

  // Create a map of existing marks by student ID
  const existingMarksMap = useMemo(() => {
    const map: Record<string, SecondaryComponentMark> = {};
    existingMarks.forEach((mark) => {
      map[mark.syncedStudentId] = mark;
    });
    return map;
  }, [existingMarks]);

  // Merge existing marks with local changes to create display rows
  const markEntryRows = useMemo<MarkEntryRow[]>(() => {
    return students.map((student) => {
      const existingMark = existingMarksMap[student.id];
      const localChange = localChanges[student.id];
      const validationError = validationErrors[student.id];

      return {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        section: student.section,
        marksObtained: localChange?.marksObtained ?? existingMark?.marksObtained ?? null,
        isAbsent: localChange?.isAbsent ?? existingMark?.isAbsent ?? false,
        status: existingMark?.status ?? "DRAFT",
        remarks: localChange?.remarks ?? existingMark?.remarks ?? null,
        hasUnsavedChanges: !!localChange,
        validationError: validationError || null,
      };
    });
  }, [students, existingMarksMap, localChanges, validationErrors]);

  // Calculate statistics
  const stats = useMemo<MarksEntryStats>(() => {
    const totalStudents = students.length;
    let enteredCount = 0;
    let absentCount = 0;
    let draftCount = 0;
    let submittedCount = 0;
    let verifiedCount = 0;
    let errorCount = 0;

    markEntryRows.forEach((row) => {
      if (row.isAbsent) {
        absentCount++;
        enteredCount++;
      } else if (row.marksObtained !== null) {
        enteredCount++;
      }

      if (row.validationError) {
        errorCount++;
      }

      if (row.status === "DRAFT") draftCount++;
      if (row.status === "SUBMITTED") submittedCount++;
      if (row.status === "VERIFIED") verifiedCount++;
    });

    const completionPercentage = totalStudents > 0 
      ? Math.round((enteredCount / totalStudents) * 100) 
      : 0;

    return {
      totalStudents,
      enteredCount,
      absentCount,
      draftCount,
      submittedCount,
      verifiedCount,
      errorCount,
      completionPercentage,
    };
  }, [students, markEntryRows]);

  // Update mark locally (doesn't save to DB yet)
  const updateMark = useCallback((studentId: string, marksObtained: number | null, isAbsent: boolean = false) => {
    setLocalChanges((prev) => ({
      ...prev,
      [studentId]: {
        syncedStudentId: studentId,
        marksObtained: isAbsent ? null : marksObtained,
        isAbsent,
      },
    }));

    // Clear validation error for this student
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[studentId];
      return newErrors;
    });
  }, []);

  // Update absent status
  const updateAbsent = useCallback((studentId: string, isAbsent: boolean) => {
    setLocalChanges((prev) => ({
      ...prev,
      [studentId]: {
        syncedStudentId: studentId,
        marksObtained: isAbsent ? null : prev[studentId]?.marksObtained ?? null,
        isAbsent,
      },
    }));
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (marks: StudentMarkInput[]) => {
      return apiClient.post("/teacher/secondary/marks", {
        componentId,
        examId,
        marks,
      });
    },
    onSuccess: () => {
      // Clear local changes
      setLocalChanges({});
      
      // Refetch marks
      queryClient.invalidateQueries({ queryKey: ["secondary-marks", componentId, examId] });
      
      toast.success("Marks saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save marks");
    },
  });

  // Save all local changes
  const saveAll = useCallback(async () => {
    const marksToSave = Object.values(localChanges);
    
    if (marksToSave.length === 0) {
      toast.info("No unsaved changes to save");
      return;
    }

    await saveMutation.mutateAsync(marksToSave);
  }, [localChanges, saveMutation]);

  // Save single student mark
  const saveSingle = useCallback(async (studentId: string) => {
    const change = localChanges[studentId];
    
    if (!change) {
      toast.info("No changes to save for this student");
      return;
    }

    await saveMutation.mutateAsync([change]);
  }, [localChanges, saveMutation]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (markIds: string[]) => {
      // First, save any pending changes
      if (Object.keys(localChanges).length > 0) {
        await saveMutation.mutateAsync(Object.values(localChanges));
      }

      // Then submit each mark individually
      await Promise.all(
        markIds.map((id) =>
          apiClient.post(`/teacher/secondary/marks/${id}/submit`, {})
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secondary-marks", componentId, examId] });
      toast.success("Marks submitted for verification");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit marks");
    },
  });

  // Submit all marks
  const submitAll = useCallback(async () => {
    const markIds = existingMarks
      .filter((m) => m.status === "DRAFT")
      .map((m) => m.id);

    if (markIds.length === 0) {
      toast.info("No marks to submit");
      return;
    }

    await submitMutation.mutateAsync(markIds);
  }, [existingMarks, submitMutation]);

  // Discard local changes
  const discardChanges = useCallback(() => {
    setLocalChanges({});
    setValidationErrors({});
    toast.info("Unsaved changes discarded");
  }, []);

  return {
    markEntryRows,
    stats,
    isLoading,
    updateMark,
    updateAbsent,
    saveAll,
    saveSingle,
    submitAll,
    discardChanges,
    isSaving: saveMutation.isPending,
    isSubmitting: submitMutation.isPending,
    hasUnsavedChanges: Object.keys(localChanges).length > 0,
    validationErrors,
  };
}
