"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSearch,
  Loader2,
  Save,
  Check,
  AlertCircle,
  FileText,
  CheckSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStudentEvaluationResults,
  useEvaluationTemplates,
} from "@/hooks/use-evaluations";
import { useStudents } from "@/hooks/use-students";
import { useAdminTeacherCompilations } from "@/hooks/use-teacher-compilations";
import { useFinalResults } from "@/hooks/use-final-results";
import { Button } from "@/components/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/shared/ui/table";
import { Student } from "@/types/academic";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import ExamResultCompilationSkeleton from "./ExamResultCompilationSkeleton";

const TranscriptModal = dynamic(
  () => import("@/components/shared/TranscriptModal"),
  { ssr: false },
);
const BulkGradeSheetsModal = dynamic(
  () => import("@/components/shared/BulkGradeSheetsModal"),
  { ssr: false },
);

interface SubjectResult {
  subjectName: string;
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
}

interface CompiledResult {
  rank?: number;
  rollNo: string;
  studentId: string;
  studentName: string;
  subjects: Record<string, SubjectResult>;
  overallPercentage: number;
  overallGrade: string;
  result: "Pass" | "Fail" | "Pending";
}

interface Props {
  examId: string;
  examName: string;
  gradeLevel: string;
  academicYearId: string;
  linkedTemplates: Array<{
    id: string;
    syncedSubjectId: string;
    name: string;
    fullMarks: number;
    passMarks: number;
    weightage: number;
    syncedSubject?: {
      id: string;
      name: string;
      code: string;
      gradeLevel: string;
    } | null;
  }>;
}

function toStudentObj(
  result: CompiledResult,
  gradeLevel: string,
  students: any[],
): Student {
  return {
    id: result.studentId,
    name: result.studentName,
    rollNo: result.rollNo,
    avatar: "",
    status: "Active Enrollment",
    class: gradeLevel,
    attendance: "100%",
    department: "General",
    overallTotal: "",
    overallPercent: result.overallPercentage,
    grade: result.overallGrade,
    resultStatus:
      result.result === "Pass"
        ? "PROMOTED"
        : result.result === "Fail"
          ? "FAILED"
          : "PENDING",
    remarks:
      result.result === "Pass"
        ? "Promoted to next grade."
        : "Failed to clear all subjects.",
    scores: Object.values(result.subjects).map((sub) => ({
      subject: sub.subjectName,
      type: "General",
      obtained: sub.totalObtained,
      max: sub.totalFull,
      pass: sub.isPassed,
    })),
    dist: {},
  };
}

export default function ExamResultCompilation({
  examId,
  examName,
  gradeLevel,
  academicYearId,
  linkedTemplates,
}: Props) {
  const [showTranscriptModal, setShowTranscriptModal] =
    useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSavedOnLoad, setShowSavedOnLoad] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGradeSheets, setBulkGradeSheets] = useState<Student[] | null>(
    null,
  );
  const [sortColumn, setSortColumn] = useState<
    "rank" | "rollNo" | "studentName"
  >("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    class: gradeLevel,
    limit: 500,
  });
  const { data: allTemplates = [], isLoading: templatesLoading } =
    useEvaluationTemplates({
      academicYearId: academicYearId || undefined,
      isActive: true,
    });

  const effectiveTemplates = useMemo(() => {
    const map = new Map<string, (typeof linkedTemplates)[0]>();

    // Linked templates (exam-specific) take priority
    for (const t of linkedTemplates) {
      map.set(t.id, t);
    }

    // Add grade-level templates from the academic year that aren't already linked
    const gradeLevelOnes = allTemplates.filter(
      (t) => t.syncedSubject?.gradeLevel === gradeLevel,
    );
    for (const t of gradeLevelOnes) {
      if (!map.has(t.id)) {
        map.set(t.id, t as any);
      }
    }

    return Array.from(map.values());
  }, [linkedTemplates, allTemplates, gradeLevel]);

  const templates = effectiveTemplates;

  const effectiveTemplateIds = useMemo(
    () => templates.map((t) => t.id),
    [templates],
  );

  const { data: resultsData = [], isLoading: resultsLoading, refetch: refetchResults } =
    useStudentEvaluationResults(
      {
        limit: 5000,
        evaluationTemplateIds:
          effectiveTemplateIds.length > 0 ? effectiveTemplateIds : undefined,
      },
      { enabled: effectiveTemplateIds.length > 0 },
    );

  const { data: teacherCompilations = [], isLoading: compilationsLoading, refetch: refetchCompilations } =
    useAdminTeacherCompilations({
      status: "SUBMITTED",
      academicYearId: academicYearId || undefined,
      gradeLevel: gradeLevel || undefined,
    });

  const isLoading =
    studentsLoading ||
    resultsLoading ||
    compilationsLoading ||
    templatesLoading;

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  const { data: finalResultsData } = useFinalResults({
    academicYearId: academicYearId || undefined,
    gradeLevel: gradeLevel || undefined,
    limit: 1,
  });

  const hasSavedResults =
    isSaved || (finalResultsData?.results?.length ?? 0) > 0;

  const dataReady = students.length > 0 && templates.length > 0;

  useEffect(() => {
    if (
      hasSavedResults &&
      dataReady &&
      !showResults &&
      !isCompiling &&
      !showSavedOnLoad
    ) {
      setShowSavedOnLoad(true);
    }
  }, [hasSavedResults, dataReady, showResults, isCompiling, showSavedOnLoad]);

  const showResultsTable = showResults || showSavedOnLoad;

  const submittedSubjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const comp of teacherCompilations) {
      if (comp.status === "SUBMITTED" && comp.syncedSubjectId)
        ids.add(comp.syncedSubjectId);
    }
    return ids;
  }, [teacherCompilations]);

  const submittedSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const t of templates) {
      if (t.syncedSubject?.name && submittedSubjectIds.has(t.syncedSubject.id))
        subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [templates, submittedSubjectIds]);

  const totalSubjectsInTemplates = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const t of templates) {
      if (t.syncedSubject?.name)
        subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [templates]);

  const marksLookup = useMemo(() => {
    const lookup: Record<
      string,
      Record<string, { marks: number | null; hasReExam: boolean }>
    > = {};
    resultsData.forEach((r) => {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      const reExamMarks = r.reExamResult?.marksObtained;
      const hasReExam = reExamMarks !== null && reExamMarks !== undefined;
      const effectiveMarks = hasReExam
        ? Number(reExamMarks)
        : r.marksObtained !== null && r.marksObtained !== undefined
          ? Number(r.marksObtained)
          : null;
      lookup[r.syncedStudentId][r.evaluationTemplateId] = {
        marks: effectiveMarks,
        hasReExam,
      };
    });
    return lookup;
  }, [resultsData]);

  const templatesBySubject = useMemo(() => {
    const map = new Map<string, typeof templates>();
    for (const t of templates) {
      const subjectName = t.syncedSubject?.name ?? "Unknown";
      if (!map.has(subjectName)) map.set(subjectName, []);
      map.get(subjectName)!.push(t);
    }
    return map;
  }, [templates]);

  const lookupGrade = (percent: number): string => {
    if (percent >= 90) return "A+";
    if (percent >= 80) return "A";
    if (percent >= 70) return "B+";
    if (percent >= 60) return "B";
    if (percent >= 50) return "C+";
    if (percent >= 40) return "C";
    return "D";
  };

  const compiledResults = useMemo((): CompiledResult[] => {
    if (students.length === 0 || totalSubjectsInTemplates.length === 0)
      return [];
    return students.map((student) => {
      const subjects: Record<string, SubjectResult> = {};
      let totalObtainedAll = 0,
        totalFullAll = 0,
        subjectCount = 0,
        hasAnyMarks = false,
        anyFailed = false;
      for (const subject of totalSubjectsInTemplates) {
        const subjectTemplates = templatesBySubject.get(subject.name) ?? [];
        if (subjectTemplates.length === 0) continue;
        let totalObtained = 0,
          totalFull = 0,
          failedEvals = 0,
          subjectHasMarks = false;
        for (const t of subjectTemplates) {
          const lookup = marksLookup[student.id]?.[t.id];
          const obtained = lookup?.marks ?? null;
          const fullMarks = Number(t.fullMarks);
          totalFull += fullMarks;
          if (obtained !== null) {
            subjectHasMarks = true;
            hasAnyMarks = true;
            totalObtained += obtained;
            if (obtained < Number(t.passMarks)) failedEvals++;
          }
        }
        const percentage =
          totalFull > 0
            ? Number(((totalObtained / totalFull) * 100).toFixed(1))
            : 0;
        const grade = subjectHasMarks ? lookupGrade(percentage) : "N/A";
        const isPassed = subjectHasMarks && failedEvals === 0;
        if (subjectHasMarks) {
          totalObtainedAll += totalObtained;
          totalFullAll += totalFull;
          subjectCount++;
        }
        if (!isPassed && subjectHasMarks) anyFailed = true;
        subjects[subject.name] = {
          subjectName: subject.name,
          totalObtained: Number(totalObtained.toFixed(2)),
          totalFull: Number(totalFull.toFixed(2)),
          percentage,
          grade,
          isPassed,
        };
      }
      const overallPercentage =
        totalFullAll > 0
          ? Number(((totalObtainedAll / totalFullAll) * 100).toFixed(1))
          : 0;
      return {
        rollNo: student.rollNumber,
        studentId: student.id,
        studentName: student.name,
        subjects,
        overallPercentage,
        overallGrade: hasAnyMarks ? lookupGrade(overallPercentage) : "N/A",
        result: !hasAnyMarks ? "Pending" : anyFailed ? "Fail" : "Pass",
      };
    });
  }, [students, totalSubjectsInTemplates, templatesBySubject, marksLookup]);

  const toggleSort = (column: "rank" | "rollNo" | "studentName") => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedResults = useMemo(() => {
    const sorted = [...compiledResults].sort((a, b) => {
      let cmp: number;
      if (sortColumn === "rank") {
        cmp = a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
      } else if (sortColumn === "rollNo") {
        cmp = a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
      } else {
        cmp = a.studentName.localeCompare(b.studentName);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted.map((r, i) => ({ ...r, rank: i + 1 }) as CompiledResult);
  }, [compiledResults, sortColumn, sortDirection]);

  const allSelected =
    compiledResults.length > 0 && selectedIds.size === compiledResults.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const toggleAll = () =>
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(compiledResults.map((r) => r.studentId)),
    );
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const handleCompile = async () => {
    if (templates.length === 0) {
      toast.error(
        "No evaluation templates found for this grade level and academic year.",
      );
      return;
    }
    if (students.length === 0) {
      toast.error("No students found for this grade level.");
      return;
    }
    setIsCompiling(true);
    setShowResults(false);
    setShowSavedOnLoad(false);
    await Promise.all([refetchResults(), refetchCompilations()]);
    setIsCompiling(false);
    setShowResults(true);
  };

  const handleSaveCompilation = async () => {
    if (compiledResults.length === 0) {
      toast.error("No results to save");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post("/admin/final-compilation", {
        academicYearId,
        examId,
        gradeLevel,
        students: compiledResults.map((r) => ({
          studentId: r.studentId,
          subjects: Object.fromEntries(
            Object.entries(r.subjects).map(([name, data]) => [
              name,
              {
                subjectId:
                  totalSubjectsInTemplates.find((s) => s.name === name)?.id ??
                  "",
                totalObtained: data.totalObtained,
                totalFull: data.totalFull,
                percentage: data.percentage,
                grade: data.grade,
                isPassed: data.isPassed,
                failedEvaluations: 0,
              },
            ]),
          ),
          overallPercentage: r.overallPercentage,
          overallGrade: r.overallGrade,
          cgpa: undefined,
          resultStatus:
            r.result === "Pass"
              ? "PROMOTED"
              : r.result === "Fail"
                ? "FAILED"
                : "PENDING",
        })),
      });
      setIsSaved(true);
      toast.success(
        `Successfully saved ${compiledResults.length} student results`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save compilation");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewAllGradeSheets = () => {
    const studentObjs = compiledResults.map((r) =>
      toStudentObj(r, gradeLevel, students),
    );
    setBulkGradeSheets(studentObjs);
  };

  if (isLoading) {
    return <ExamResultCompilationSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {linkedTemplates.length === 0 && effectiveTemplates.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Templates not linked to this exam
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Showing all evaluation templates for {gradeLevel}. To link
              templates to this exam, update each template's exam assignment
              from the evaluation templates management page.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        {!isCompiling && !showResultsTable && !hasSavedResults && (
          <Button
            onClick={handleCompile}
            className="w-full flex items-center gap-2"
          >
            <FileSearch className="w-4 h-4" />
            Compile Results
          </Button>
        )}
        {showResultsTable && !isCompiling && (
          <div className="flex items-center gap-2">
            {hasSavedResults && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            <Button
              onClick={async () => {
                setIsCompiling(true);
                setShowResults(false);
                setShowSavedOnLoad(false);
                await Promise.all([refetchResults(), refetchCompilations()]);
                setIsCompiling(false);
                setShowResults(true);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSearch className="w-4 h-4" />
              Recompile
            </Button>
          </div>
        )}
      </div>

      {totalSubjectsInTemplates.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Subject Submission Status
            </h3>
            <span className="text-xs text-muted-foreground">
              {submittedSubjects.length} of {totalSubjectsInTemplates.length}{" "}
              subjects submitted
            </span>
          </div>
          {submittedSubjects.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <AlertCircle className="w-4 h-4" />
              No subjects have been submitted by teachers yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {submittedSubjects.map((subject) => {
                  const comp = teacherCompilations.find(
                    (c) => c.subject.name === subject.name,
                  );
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                    >
                      <Check className="w-3 h-3" />
                      {subject.name}
                      {comp && (
                        <span className="text-emerald-500 dark:text-emerald-400 ml-1">
                          ({comp.teacher.name})
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalSubjectsInTemplates.length > submittedSubjects.length && (
                <div className="flex flex-wrap gap-2">
                  {totalSubjectsInTemplates
                    .filter(
                      (s) => !submittedSubjects.some((sub) => sub.id === s.id),
                    )
                    .map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground text-xs font-medium"
                      >
                        {subject.name}
                        <span className="text-[10px]">(not submitted)</span>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {isCompiling && (
          <motion.div
            key="compiling-progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-xl border border-border shadow-sm p-10"
          >
            <div className="flex flex-col items-center justify-center gap-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Loader2 className="w-12 h-12 text-primary" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  Compiling Results...
                </h3>
                <p className="text-sm text-muted-foreground">
                  Processing student marks and computing grades
                </p>
              </div>
              <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showResultsTable && !isCompiling && compiledResults.length === 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
          <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">
            No Results Found
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            No student marks available for the selected filters.
          </p>
        </div>
      )}

      <AnimatePresence>
        {showResultsTable && !isCompiling && compiledResults.length > 0 && (
          <motion.div
            key="compiled-results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card rounded-xl border border-border shadow-sm p-5"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Compiled Results ({compiledResults.length} students ·{" "}
                {totalSubjectsInTemplates.length} subjects)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={toggleAll}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 py-2 text-xs font-semibold cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
                {selectedIds.size > 0 && (
                  <Button
                    onClick={() => setSelectedIds(new Set())}
                    variant="outline"
                    className="flex items-center gap-1.5 h-9 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear ({selectedIds.size})
                  </Button>
                )}
                <Button
                  onClick={handleViewAllGradeSheets}
                  variant="outline"
                  className="flex items-center gap-2 h-9 py-2 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  View All Grade Sheets
                </Button>
                <Button
                  onClick={handleSaveCompilation}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save to Database"}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="border border-border px-3 py-2 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected;
                        }}
                        onChange={toggleAll}
                        className="cursor-pointer accent-primary"
                      />
                    </TableHead>
                    <TableHead
                      className="border border-border px-3 py-2 text-center font-bold text-foreground w-12 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggleSort("rank")}
                    >
                      Rank
                      {sortColumn === "rank" && (
                        <span className="ml-1 text-xs">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-0 bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggleSort("rollNo")}
                    >
                      Roll No
                      {sortColumn === "rollNo" && (
                        <span className="ml-1 text-xs">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-[72px] bg-muted/40 cursor-pointer select-none hover:bg-muted/60 transition-colors"
                      onClick={() => toggleSort("studentName")}
                    >
                      Student Name
                      {sortColumn === "studentName" && (
                        <span className="ml-1 text-xs">
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </TableHead>
                    {submittedSubjects.map((s) => (
                      <TableHead
                        key={s.id}
                        className="border border-border px-3 py-2 text-center font-bold text-foreground"
                      >
                        {s.name}
                      </TableHead>
                    ))}
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      Overall %
                    </TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      Grade
                    </TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      Result
                    </TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result) => (
                    <TableRow
                      key={result.studentId}
                      className={cn(
                        "hover:bg-muted/20",
                        selectedIds.has(result.studentId) &&
                          "bg-blue-50/40 dark:bg-blue-950/20",
                      )}
                    >
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(result.studentId)}
                          onChange={() => toggleSelect(result.studentId)}
                          className="cursor-pointer accent-primary"
                        />
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center font-bold text-foreground text-xs">
                        {result.rank}
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground sticky left-0 bg-background">
                        {result.rollNo}
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground sticky left-[66px] bg-background">
                        {result.studentName}
                      </TableCell>
                      {submittedSubjects.map((s) => {
                        const sub = result.subjects[s.name];
                        return (
                          <TableCell
                            key={s.id}
                            className="border border-border px-3 py-2 text-center text-foreground"
                          >
                            {sub ? (
                              <span
                                className={cn(
                                  "font-mono text-xs",
                                  !sub.isPassed &&
                                    sub.subjectName &&
                                    "text-destructive",
                                )}
                              >
                                {sub.percentage.toFixed(1)}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                        {result.overallPercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                        {result.overallGrade}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "border border-border px-3 py-2 text-center font-bold",
                          result.result === "Pass"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : result.result === "Fail"
                              ? "text-destructive"
                              : "text-muted-foreground",
                        )}
                      >
                        {result.result}
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <button
                          onClick={() =>
                            setShowTranscriptModal(
                              toStudentObj(result, gradeLevel, students),
                            )
                          }
                          className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          View Grade Sheet
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TranscriptModal
        showTranscriptModal={showTranscriptModal}
        setShowTranscriptModal={setShowTranscriptModal}
      />
      {bulkGradeSheets && (
        <BulkGradeSheetsModal
          students={bulkGradeSheets}
          onClose={() => setBulkGradeSheets(null)}
        />
      )}
    </motion.div>
  );
}
