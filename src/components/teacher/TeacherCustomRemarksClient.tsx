"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useProfile } from "@/hooks/use-profile";
import { useExams } from "@/hooks/use-exams";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
}

export default function TeacherCustomRemarksClient() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();

  const isClassTeacher = !!profile?.syncedTeacher?.classTeacherId;
  const classTeacherName = profile?.syncedTeacher?.classTeacherClassName;

  const { data: classroom, isLoading: isClassroomLoading } = useQuery({
    queryKey: ["teacher-custom-remarks-classroom"],
    queryFn: async () => {
      const res = await apiClient.get("/teacher/observations/classroom");
      return res as unknown as {
        classTeacherId: string;
        classTeacherClassName: string;
        students: Student[];
      };
    },
    enabled: isClassTeacher,
  });

  const examFilters = useMemo(
    () => ({
      gradeLevel: classTeacherName ?? undefined,
      isActive: true,
    }),
    [classTeacherName],
  );

  const { data: exams = [], isLoading: isExamsLoading } = useExams(examFilters);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: existingRemarks, isLoading: isRemarksLoading } = useQuery({
    queryKey: ["teacher-custom-remarks", selectedExamId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/teacher/custom-remarks?examId=${selectedExamId}`,
      );
      return (
        res as unknown as {
          remarks: Record<string, { id: string; remark: string }>;
        }
      ).remarks;
    },
    enabled: !!selectedExamId,
  });

  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  const [savedRemarks, setSavedRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingRemarks) {
      const map: Record<string, string> = {};
      for (const [studentId, data] of Object.entries(existingRemarks)) {
        map[studentId] = data.remark;
      }
      setRemarksMap(map);
      setSavedRemarks({ ...map });
      setInitialized(true);
    }
  }, [existingRemarks]);

  useEffect(() => {
    if (!selectedExamId) {
      setRemarksMap({});
      setSavedRemarks({});
      setInitialized(false);
    }
  }, [selectedExamId]);

  const students = classroom?.students ?? [];

  const handleRemarkChange = useCallback((studentId: string, value: string) => {
    setRemarksMap((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  }, []);

  const hasChanges =
    JSON.stringify(remarksMap) !== JSON.stringify(savedRemarks);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const remarks = Object.entries(remarksMap).map(
        ([syncedStudentId, remark]) => ({
          syncedStudentId,
          remark,
        }),
      );
      return apiClient.post("/teacher/custom-remarks", {
        examId: selectedExamId,
        remarks,
      });
    },
    onSuccess: () => {
      setSavedRemarks({ ...remarksMap });
      queryClient.invalidateQueries({
        queryKey: ["teacher-custom-remarks", selectedExamId],
      });
      toast.success("Custom remarks saved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save remarks");
    },
  });

  const isLoading = isProfileLoading || isClassroomLoading || isExamsLoading;
  const isSaving = saveMutation.isPending;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isClassTeacher) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        You are not assigned as a class teacher.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Class Teacher Remarks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter a custom remark for each student that will appear on their
            grade sheet.
          </p>
        </div>
        {selectedExamId && (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save
          </Button>
        )}
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium mb-1.5 block">Select Exam</label>
        <select
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="">-- Choose an exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} ({exam.academicYear?.name})
            </option>
          ))}
        </select>
      </div>

      {selectedExamId && isRemarksLoading && !initialized && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedExamId && initialized && students.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No students found in your class.
        </div>
      )}

      {selectedExamId && initialized && students.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-2.5 font-medium w-16">
                  Roll No
                </th>
                <th className="text-left px-4 py-2.5 font-medium w-48">
                  Student Name
                </th>
                <th className="text-left px-4 py-2.5 font-medium">Remark</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const current = remarksMap[student.id] ?? "";
                const isSaved = current === savedRemarks[student.id];
                return (
                  <tr
                    key={student.id}
                    className="border-b last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2 text-muted-foreground">
                      {student.rollNumber}
                    </td>
                    <td className="px-4 py-2 font-medium">{student.name}</td>
                    <td className="px-4 py-2">
                      <div className="relative">
                        <textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y min-h-[60px]"
                          rows={3}
                          maxLength={2000}
                          value={current}
                          onChange={(e) =>
                            handleRemarkChange(student.id, e.target.value)
                          }
                          placeholder="Enter remark for this student..."
                        />
                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={cn(
                              "text-[10px]",
                              current.length > 1900
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {current.length}/2000
                          </span>
                          {isSaved && current.length > 0 && (
                            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                              Saved
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
