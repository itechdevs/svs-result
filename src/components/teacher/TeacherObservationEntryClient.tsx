"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  Loader2,
  Save,
  CheckCircle2,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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

interface ObservationItem {
  id: string;
  description: string;
  choices: string[] | null;
  displayOrder: number;
}

interface ObservationCategory {
  id: string;
  title: string;
  displayOrder: number;
  items: ObservationItem[];
}

interface Exam {
  id: string;
  name: string;
  academicYear: { name: string };
}

interface ObservationResult {
  id: string;
  syncedStudentId: string;
  observationItemId: string;
  selectedOption: string;
  remarks?: string | null;
}

export default function TeacherObservationEntryClient() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const queryClient = useQueryClient();

  const classTeacherName = profile?.syncedTeacher?.classTeacherClassName;

  const { data: classroom, isLoading: isClassroomLoading } = useQuery({
    queryKey: ["teacher-observation-classroom"],
    queryFn: async () => {
      const res = await apiClient.get("/teacher/observations/classroom");
      return res as unknown as { classTeacherId: string; classTeacherClassName: string; students: Student[] };
    },
    enabled: !!profile?.syncedTeacher?.classTeacherId,
  });

  const examFilters = useMemo(() => ({
    gradeLevel: classTeacherName ?? undefined,
    isActive: true,
  }), [classTeacherName]);

  const { data: exams = [], isLoading: isExamsLoading } = useExams(examFilters);

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["teacher-observation-categories"],
    queryFn: async () => {
      const res = await apiClient.get("/teacher/observations/categories");
      return res as unknown as ObservationCategory[];
    },
  });

  const [selectedExamId, setSelectedExamId] = useState("");
  const syncRef = useRef({ examId: "", dataHash: "" });

  const exam = exams.find((e) => e.id === selectedExamId);

  const { data: existingResults = [], isLoading: isResultsLoading } = useQuery({
    queryKey: ["teacher-observation-results", selectedExamId],
    queryFn: async () => {
      const res = await apiClient.get(`/teacher/observations/results?examId=${selectedExamId}`);
      return res as unknown as ObservationResult[];
    },
    enabled: !!selectedExamId,
  });

  const [resultsMap, setResultsMap] = useState<Record<string, Record<string, string>>>({});
  const [savedResults, setSavedResults] = useState<Record<string, Record<string, string>>>({});

  // Sync from server only when exam selection changes or data actually changes
  const dataHash = existingResults.length > 0
    ? existingResults.map(r => `${r.syncedStudentId}:${r.observationItemId}:${r.selectedOption}`).join("|")
    : "";
  if (syncRef.current.examId !== selectedExamId || syncRef.current.dataHash !== dataHash) {
    syncRef.current = { examId: selectedExamId, dataHash };
    if (existingResults.length > 0) {
      const map: Record<string, Record<string, string>> = {};
      for (const r of existingResults) {
        if (!map[r.syncedStudentId]) map[r.syncedStudentId] = {};
        map[r.syncedStudentId][r.observationItemId] = r.selectedOption;
      }
      setResultsMap(map);
      setSavedResults(JSON.parse(JSON.stringify(map)));
    } else if (selectedExamId) {
      setResultsMap({});
      setSavedResults({});
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (data: { examId: string; results: { syncedStudentId: string; observationItemId: string; selectedOption: string }[] }) => {
      return apiClient.post("/teacher/observations/results", data);
    },
    onSuccess: () => {
      setSavedResults(JSON.parse(JSON.stringify(resultsMap)));
      queryClient.invalidateQueries({ queryKey: ["teacher-observation-results", selectedExamId] });
      toast.success("Observations saved");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save observations");
    },
  });

  const students = classroom?.students ?? [];
  const flatItems = useMemo(() => {
    return categories.flatMap((c) => c.items ?? []);
  }, [categories]);

  const handleSelect = useCallback((studentId: string, itemId: string, value: string, categoryItemIds?: string[]) => {
    setResultsMap((prev) => {
      const next = { ...prev };
      if (categoryItemIds && value) {
        const cleared = { ...next[studentId] };
        for (const id of categoryItemIds) {
          delete cleared[id];
        }
        cleared[itemId] = value;
        next[studentId] = cleared;
      } else {
        if (!next[studentId]) next[studentId] = {};
        next[studentId] = { ...next[studentId], [itemId]: value };
      }
      return next;
    });
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(resultsMap) !== JSON.stringify(savedResults);
  }, [resultsMap, savedResults]);

  const handleSaveAll = async () => {
    if (!selectedExamId || !hasChanges) return;
    const results: { syncedStudentId: string; observationItemId: string; selectedOption: string }[] = [];
    for (const [studentId, items] of Object.entries(resultsMap)) {
      for (const [itemId, value] of Object.entries(items)) {
        results.push({ syncedStudentId: studentId, observationItemId: itemId, selectedOption: value });
      }
    }
    saveMutation.mutate({ examId: selectedExamId, results });
  };

  const isLoading = isProfileLoading || isClassroomLoading || isExamsLoading || isCategoriesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.syncedTeacher?.classTeacherId) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border shadow-sm p-12 text-center"
      >
        <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">Not a Class Teacher</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          You are not assigned as a class teacher. Only class teachers can enter observations.
        </p>
      </motion.div>
    );
  }

  if (!classroom || students.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 0, y: 0 }}
        className="bg-card rounded-xl border border-border shadow-sm p-12 text-center"
      >
        <p className="text-sm text-muted-foreground">No students found for {classTeacherName}.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Observations — {classTeacherName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Record observation ratings for each student
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium"
          >
            <option value="">Select an exam...</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.academicYear?.name ?? "—"})
              </option>
            ))}
          </select>
          <Button
            onClick={handleSaveAll}
            disabled={!selectedExamId || !hasChanges || saveMutation.isPending}
            className="gap-2 text-xs font-bold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveMutation.isPending ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      {!selectedExamId ? (
        <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Select an Exam</h2>
          <p className="text-sm text-muted-foreground">
            Choose an exam above to start entering observations.
          </p>
        </div>
      ) : isResultsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              students={students}
              resultsMap={resultsMap}
              onSelect={handleSelect}
              onSelectAll={(studentId, itemIds) => {
                setResultsMap((prev) => {
                  const next = { ...prev };
                  const row = { ...next[studentId] };
                  for (const id of category.items.map(i => i.id)) {
                    delete row[id];
                  }
                  for (const id of itemIds) {
                    row[id] = "Yes";
                  }
                  next[studentId] = row;
                  return next;
                });
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CategorySection({
  category,
  students,
  resultsMap,
  onSelect,
  onSelectAll,
}: {
  category: ObservationCategory;
  students: Student[];
  resultsMap: Record<string, Record<string, string>>;
  onSelect: (studentId: string, itemId: string, value: string, categoryItemIds?: string[]) => void;
  onSelectAll: (studentId: string, itemIds: string[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const items = category.items ?? [];
  const categoryItemIds = useMemo(() => items.map(i => i.id), [items]);

  if (items.length === 0) return null;

  const handleSelectAll = () => {
    for (const student of students) {
      onSelectAll(student.id, categoryItemIds);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        <span className="font-bold text-sm text-foreground">{category.title}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{items.length} items</span>
      </button>

      {!collapsed && (
        <div>
          <div className="flex items-center gap-2 px-5 py-2 border-b border-border bg-muted/10">
            <button
              onClick={handleSelectAll}
              className="text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Select All
            </button>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="px-4 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-48 sticky left-0 bg-muted/20 z-10">Student</th>
                {items.map((item) => (
                  <th key={item.id} className="px-3 py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                    {item.description}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => {
                const studentResults = resultsMap[student.id] ?? {};
                return (
                  <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium text-foreground sticky left-0 bg-card hover:bg-muted/20 z-10">
                      <span className="text-muted-foreground mr-2">{student.rollNumber}.</span>
                      {student.name}
                    </td>
                    {items.map((item) => {
                      const choices = item.choices as string[] | null;
                      const selected = studentResults[item.id] ?? "";
                      return (
                        <td key={item.id} className="px-3 py-2.5">
                          {choices && choices.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {choices.map((choice) => (
                                <label
                                  key={choice}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-[11px] leading-tight",
                                    selected === choice
                                      ? "border-primary bg-primary/5 text-foreground font-medium"
                                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-muted/30",
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name={`${student.id}-${item.id}`}
                                    value={choice}
                                    checked={selected === choice}
                                    onChange={() => onSelect(student.id, item.id, choice)}
                                    className="sr-only"
                                  />
                                  <div className={cn(
                                    "w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center",
                                    selected === choice ? "border-primary" : "border-muted-foreground/40",
                                  )}>
                                    {selected === choice && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                  </div>
                                  {choice}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <label
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-md border cursor-pointer transition-colors text-[11px] leading-tight w-fit",
                                selected === "Yes"
                                  ? "border-primary bg-primary/5 text-foreground font-medium"
                                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-muted/30",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selected === "Yes"}
                                onChange={() => onSelect(student.id, item.id, selected === "Yes" ? "" : "Yes", categoryItemIds)}
                                className="sr-only"
                              />
                              <div className={cn(
                                "w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                                selected === "Yes" ? "bg-primary border-primary" : "border-muted-foreground/40",
                              )}>
                                {selected === "Yes" && (
                                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              Yes
                            </label>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}
    </div>
  );
}
