"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
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
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStudentEvaluationResults,
  useEvaluationTemplates,
} from "@/hooks/use-evaluations";
import { useStudents } from "@/hooks/use-students";
import { useAdminTeacherCompilations } from "@/hooks/use-teacher-compilations";
import { useFinalResults } from "@/hooks/use-final-results";
import { useGradeConfigs, type GradeScale } from "@/hooks/use-academic-config";
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
import type { PrePrimaryStudentData } from "@/components/shared/PrePrimaryTranscriptModal";
import type { StudentObservationEntry } from "@/components/shared/pre-primarygrade";
import { formatToBSDateString } from "@/lib/bs-calendar";

const TranscriptModal = dynamic(
  () => import("@/components/shared/TranscriptModal"),
  { ssr: false },
);
const BulkGradeSheetsModal = dynamic(
  () => import("@/components/shared/BulkGradeSheetsModal"),
  { ssr: false },
);
const PrePrimaryTranscriptModal = dynamic(
  () => import("@/components/shared/PrePrimaryTranscriptModal"),
  { ssr: false },
);
const PrePrimaryBulkGradeSheetsModal = dynamic(
  () => import("@/components/shared/PrePrimaryBulkGradeSheetsModal"),
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
  hasReExam?: boolean;
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
  schoolLevel?: "PRE_PRIMARY" | "PRIMARY" | "SECONDARY" | "HIGHER" | null;
}

/** Observation data keyed by syncedStudentId */
type ObservationMap = Record<string, StudentObservationEntry[]>;

function toStudentObj(
  result: CompiledResult,
  gradeLevel: string,
  students: any[],
  examName?: string,
): Student {
  // Look up the matched student record to get the date of birth
  const matched = students.find((s) => s.id === result.studentId);
  const rawDob = matched?.dateOfBirth ?? null;

  // Convert DB date → BS string; keep raw AD string for display
  let dateOfBirth: string | undefined;
  let dateOfBirthAD: string | undefined;
  if (rawDob) {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const d = typeof rawDob === "string" ? new Date(rawDob) : rawDob;
    if (!isNaN(d.getTime())) {
      dateOfBirth = formatToBSDateString(d) || undefined;
      dateOfBirthAD = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
  }

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
    rank: result.rank ?? 1,
    examName,
    dateOfBirth,
    dateOfBirthAD,
  };
}

export default function ExamResultCompilation({
  examId,
  examName,
  gradeLevel,
  academicYearId,
  linkedTemplates,
  schoolLevel,
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

  // ── Observation toggle ──────────────────────────────────────────────────────
  // null = not yet decided; true = include (use PrePrimary gradesheet);
  // false = don't include (use standard gradesheet)
  const [includeObservation, setIncludeObservation] = useState<boolean | null>(
    null,
  );
  const [observationMap, setObservationMap] = useState<ObservationMap>({});
  const [customRemarksMap, setCustomRemarksMap] = useState<
    Record<string, string>
  >({});
  const [isLoadingObservations, setIsLoadingObservations] = useState(false);
  // For pre-primary single modal
  const [prePrimaryModal, setPrePrimaryModal] =
    useState<PrePrimaryStudentData | null>(null);
  // For pre-primary bulk modal
  const [prePrimaryBulk, setPrePrimaryBulk] = useState<
    PrePrimaryStudentData[] | null
  >(null);

  // Auto-enable observation mode for pre-primary, disable for secondary+
  useEffect(() => {
    if (schoolLevel === "PRE_PRIMARY" && includeObservation === null) {
      setIncludeObservation(true);
      loadObservations();
      loadCustomRemarks();
    } else if (
      (schoolLevel === "SECONDARY" || schoolLevel === "HIGHER") &&
      includeObservation === null
    ) {
      setIncludeObservation(false);
    }
  }, [schoolLevel]);

  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    class: gradeLevel,
    limit: 500,
  });
  const { data: allTemplates = [], isLoading: templatesLoading } =
    useEvaluationTemplates({
      academicYearId: academicYearId || undefined,
      isActive: true,
    });

  // Only use templates that are explicitly linked to this exam.
  // This ensures admin only compiles results from plans teachers submitted for THIS exam.
  const effectiveTemplates = useMemo(() => {
    // linkedTemplates comes from the exam's evaluationTemplates relation — already filtered to this exam.
    // If for some reason none are linked, fall back to allTemplates filtered by examId.
    if (linkedTemplates.length > 0) {
      return linkedTemplates;
    }
    // Fallback: filter allTemplates by examId
    return allTemplates.filter(
      (t) =>
        (t as any).examId === examId &&
        t.syncedSubject?.gradeLevel === gradeLevel,
    );
  }, [linkedTemplates, allTemplates, examId, gradeLevel]);

  const templates = effectiveTemplates;

  const effectiveTemplateIds = useMemo(
    () => templates.map((t) => t.id),
    [templates],
  );

  const {
    data: resultsData = [],
    isLoading: resultsLoading,
    refetch: refetchResults,
  } = useStudentEvaluationResults(
    {
      limit: 5000,
      evaluationTemplateIds:
        effectiveTemplateIds.length > 0 ? effectiveTemplateIds : undefined,
    },
    { enabled: effectiveTemplateIds.length > 0 },
  );

  const {
    data: teacherCompilations = [],
    isLoading: compilationsLoading,
    refetch: refetchCompilations,
  } = useAdminTeacherCompilations({
    status: "SUBMITTED",
    academicYearId: academicYearId || undefined,
    gradeLevel: gradeLevel || undefined,
    examId: examId || undefined,
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

  // Fetch grade config for DB-driven grade scale lookup
  const { data: gradeConfigs = [] } = useGradeConfigs({
    academicYearId: academicYearId || undefined,
    gradeLevel: gradeLevel || undefined,
  });

  const gradeScales = useMemo((): GradeScale[] => {
    const config = gradeConfigs.find(
      (c) => c.gradeLevel === gradeLevel && c.academicYearId === academicYearId,
    );
    return config?.gradeScales ?? [];
  }, [gradeConfigs, gradeLevel, academicYearId]);

  const hasSavedResults =
    isSaved || (finalResultsData?.results?.length ?? 0) > 0;

  // Subject IDs from compilations submitted to THIS exam
  const submittedSubjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const comp of teacherCompilations) {
      if (comp.status === "SUBMITTED" && comp.syncedSubjectId)
        ids.add(comp.syncedSubjectId);
    }
    return ids;
  }, [teacherCompilations]);

  // Subjects submitted to THIS exam (from teacher compilations filtered by examId)
  const submittedSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const comp of teacherCompilations) {
      if (comp.status === "SUBMITTED" && comp.subject?.name) {
        subjectMap.set(comp.subject.name, comp.syncedSubjectId);
      }
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [teacherCompilations]);

  // All subjects referenced by linked templates for this exam
  const totalSubjectsInTemplates = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const t of templates) {
      if (t.syncedSubject?.name)
        subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [templates]);

  const dataReady =
    students.length > 0 &&
    (templates.length > 0 || submittedSubjects.length > 0);

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

  const studentsWithReExam = useMemo(() => {
    const set = new Set<string>();
    for (const [studentId, subjects] of Object.entries(marksLookup)) {
      for (const entry of Object.values(subjects)) {
        if (entry.hasReExam) {
          set.add(studentId);
          break;
        }
      }
    }
    return set;
  }, [marksLookup]);

  const templatesBySubject = useMemo(() => {
    const map = new Map<string, typeof templates>();
    for (const t of templates) {
      const subjectName = t.syncedSubject?.name ?? "Unknown";
      if (!map.has(subjectName)) map.set(subjectName, []);
      map.get(subjectName)!.push(t);
    }
    return map;
  }, [templates]);

  // DB-driven grade lookup using grade scales configured by admin.
  // Falls back to a simple hardcoded scale only when no DB config exists.
  const lookupGrade = useCallback(
    (percent: number): string => {
      if (gradeScales.length > 0) {
        const scale = gradeScales.find(
          (s) =>
            percent >= Number(s.minPercent) && percent <= Number(s.maxPercent),
        );
        return scale?.grade ?? "N/A";
      }
      // Fallback hardcoded scale
      if (percent >= 90) return "A+";
      if (percent >= 80) return "A";
      if (percent >= 70) return "B+";
      if (percent >= 60) return "B";
      if (percent >= 50) return "C+";
      if (percent >= 40) return "C";
      return "D";
    },
    [gradeScales],
  );

  const compiledResults = useMemo((): CompiledResult[] => {
    if (students.length === 0 || submittedSubjects.length === 0) return [];

    return students.map((student) => {
      const subjects: Record<string, SubjectResult> = {};
      let totalObtainedAll = 0;
      let totalFullAll = 0;
      let hasAnyMarks = false;
      let anyFailed = false;

      // Only compile subjects that teachers actually submitted to THIS exam
      for (const subject of submittedSubjects) {
        // Get only the templates for this subject that are linked to this exam
        const subjectTemplates = (
          templatesBySubject.get(subject.name) ?? []
        ).filter(
          (t) =>
            (t as any).examId === examId ||
            linkedTemplates.some((lt) => lt.id === t.id),
        );
        if (subjectTemplates.length === 0) continue;

        let totalObtained = 0;
        let totalFull = 0;
        let failedEvals = 0;
        let subjectHasMarks = false;

        for (const t of subjectTemplates) {
          const lookup = marksLookup[student.id]?.[t.id];
          const obtained = lookup?.marks ?? null;
          const fullMarks = Number(t.fullMarks);
          const passMarks = Number(t.passMarks);

          if (obtained !== null) {
            totalFull += fullMarks;
            subjectHasMarks = true;
            hasAnyMarks = true;
            totalObtained += obtained;
            if (obtained < passMarks) failedEvals++;
          }
        }

        // percentage = obtained / full * 100 (raw, not weighted)
        const percentage =
          totalFull > 0
            ? Number(((totalObtained / totalFull) * 100).toFixed(1))
            : 0;
        const grade = subjectHasMarks ? lookupGrade(percentage) : "N/A";
        const isPassed = subjectHasMarks && failedEvals === 0;

        if (subjectHasMarks) {
          totalObtainedAll += totalObtained;
          totalFullAll += totalFull;
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

      // Overall: percentage = sum(obtained) / sum(full) * 100
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
        hasReExam: studentsWithReExam.has(student.id),
      };
    });
  }, [
    students,
    submittedSubjects,
    templatesBySubject,
    marksLookup,
    studentsWithReExam,
    lookupGrade,
    examId,
    linkedTemplates,
  ]);

  const toggleSort = (column: "rank" | "rollNo" | "studentName") => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedResults = useMemo(() => {
    const regularPass = compiledResults
      .filter((r) => r.result === "Pass" && !r.hasReExam)
      .sort((a, b) => b.overallPercentage - a.overallPercentage);

    const reExamPass = compiledResults
      .filter((r) => r.result === "Pass" && r.hasReExam)
      .sort((a, b) => b.overallPercentage - a.overallPercentage);

    const others = compiledResults
      .filter((r) => r.result !== "Pass")
      .sort((a, b) =>
        a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }),
      );

    const groups = [regularPass, reExamPass, others];

    let rankCounter = 1;
    for (const group of groups) {
      for (const r of group) {
        r.rank = rankCounter++;
      }
    }

    const all = [...regularPass, ...reExamPass, ...others];

    if (sortColumn === "rollNo") {
      all.sort((a, b) =>
        a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }),
      );
    } else if (sortColumn === "studentName") {
      all.sort((a, b) => a.studentName.localeCompare(b.studentName));
    }
    return sortDirection === "desc" ? all.reverse() : all;
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
    if (teacherCompilations.length === 0 && templates.length === 0) {
      toast.error(
        "No teacher submissions found for this exam. Teachers must submit their results first.",
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
                  submittedSubjects.find((s) => s.name === name)?.id ??
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
    const resultsToView =
      selectedIds.size > 0
        ? compiledResults.filter((r) => selectedIds.has(r.studentId))
        : compiledResults;

    const studentObjs = resultsToView.map((r) =>
      toStudentObj(r, gradeLevel, students, examName),
    );
    setBulkGradeSheets(studentObjs);
  };

  // ── Observation helpers ─────────────────────────────────────────────────────

  /** Fetch observation data from the DB for the current exam + grade level */
  const loadObservations = async (): Promise<ObservationMap> => {
    try {
      setIsLoadingObservations(true);
      const res = (await apiClient.get(
        `/admin/observations/results?examId=${examId}&class=${encodeURIComponent(gradeLevel)}`,
      )) as {
        students: Array<{
          syncedStudentId: string;
          results: StudentObservationEntry[];
        }>;
      };
      const map: ObservationMap = {};
      for (const s of res.students ?? []) {
        map[s.syncedStudentId] = s.results;
      }
      setObservationMap(map);
      return map;
    } catch {
      toast.error("Could not load observation data");
      return {};
    } finally {
      setIsLoadingObservations(false);
    }
  };

  /** Fetch custom remarks from the DB for the current exam + grade level */
  const loadCustomRemarks = async (): Promise<Record<string, string>> => {
    try {
      const res = (await apiClient.get(
        `/admin/custom-remarks?examId=${examId}&class=${encodeURIComponent(gradeLevel)}`,
      )) as { remarks: Record<string, string> };
      const map = res.remarks ?? {};
      setCustomRemarksMap(map);
      return map;
    } catch {
      toast.error("Could not load custom remarks");
      return {};
    }
  };

  /**
   * Build a PrePrimaryStudentData object for a single compiled result.
   * obsMap defaults to the current observationMap state.
   */
  const toPrePrimaryData = (
    result: CompiledResult,
    obsMap: ObservationMap = observationMap,
    remarksMap: Record<string, string> = customRemarksMap,
  ): PrePrimaryStudentData => {
    const matched = students.find((s) => s.id === result.studentId);
    const rawDob = matched?.dateOfBirth ?? null;

    let dateOfBirth: string | undefined;
    let dateOfBirthAD: string | undefined;
    if (rawDob) {
      const pad = (n: number) => n.toString().padStart(2, "0");
      const d = typeof rawDob === "string" ? new Date(rawDob) : rawDob;
      if (!isNaN(d.getTime())) {
        dateOfBirth = formatToBSDateString(d) || undefined;
        dateOfBirthAD = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
    }

    return {
      studentId: result.studentId,
      studentName: result.studentName,
      rollNo: result.rollNo,
      className: gradeLevel,
      section: "",
      dateOfBirth,
      dateOfBirthAD,
      subjects: Object.values(result.subjects).map((s) => ({
        subjectName: s.subjectName,
        grade: s.grade,
        gradePoint: null,
        remarks: null,
      })),
      gpa: null,
      rank: result.rank ?? null,
      attendance: "",
      observationResults: obsMap[result.studentId] ?? [],
      customRemark: remarksMap[result.studentId] ?? null,
      examName,
      academicYear: "",
    };
  };

  /** Called when admin clicks "View Grade Sheet" in observation mode */
  const handleViewPrePrimaryGradeSheet = async (result: CompiledResult) => {
    let obs = observationMap;
    let remarks = customRemarksMap;
    if (Object.keys(obs).length === 0) {
      obs = await loadObservations();
      remarks = await loadCustomRemarks();
    }
    setPrePrimaryModal(toPrePrimaryData(result, obs, remarks));
  };

  /** Called when admin clicks "View All Grade Sheets" in observation mode */
  const handleViewAllPrePrimaryGradeSheets = async () => {
    let obs = observationMap;
    let remarks = customRemarksMap;
    if (Object.keys(obs).length === 0) {
      obs = await loadObservations();
      remarks = await loadCustomRemarks();
    }

    const resultsToView =
      selectedIds.size > 0
        ? sortedResults.filter((r) => selectedIds.has(r.studentId))
        : sortedResults;

    setPrePrimaryBulk(
      resultsToView.map((r) => toPrePrimaryData(r, obs, remarks)),
    );
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
      {linkedTemplates.length === 0 && teacherCompilations.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              No evaluation plans linked to this exam
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Teachers need to submit their subject compilations for this exam
              before results can be compiled. Ask teachers to go to Result
              Compilation, select this exam, choose their evaluation plans and
              submit.
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

      {/* ── Observation toggle / School-level notice ──────────────────── */}
      {(showResultsTable || hasSavedResults) &&
        !isCompiling &&
        includeObservation === null &&
        (schoolLevel === "SECONDARY" || schoolLevel === "HIGHER" ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-5">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Secondary Level Exam
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This exam is at the secondary level. Use the Secondary Mark
                  Entry and Result Compilation pages for component-based
                  assessment (Theory, Practical, Internal).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/secondary/mark-verification"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              >
                Go to Secondary Mark Verification
              </Link>
              <Link
                href="/admin/secondary/result-compilation"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted"
              >
                Go to Secondary Result Compilation
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-primary/30 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <ClipboardList className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Include Observation in Grade Sheet?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  If the class teacher has entered observations for this exam,
                  you can include them in the grade sheet (Pre-Primary format).
                  Otherwise the standard marksheet template will be used.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  setIncludeObservation(true);
                  await loadObservations();
                  await loadCustomRemarks();
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground"
              >
                <ClipboardList className="w-4 h-4" />
                Yes, include observation
              </Button>
              <Button
                variant="outline"
                onClick={() => setIncludeObservation(false)}
                className="flex items-center gap-2"
              >
                No, use standard template
              </Button>
            </div>
          </div>
        ))}

      {/* Observation mode active banner */}
      {(showResultsTable || hasSavedResults) &&
        !isCompiling &&
        includeObservation !== null && (
          <div
            className={cn(
              "rounded-xl border p-4 flex items-center gap-3",
              includeObservation
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                : "bg-muted/40 border-border",
            )}
          >
            <ClipboardList
              className={cn(
                "w-4 h-4 shrink-0",
                includeObservation
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground",
              )}
            />
            <p className="text-xs font-semibold text-foreground flex-1">
              {includeObservation
                ? "Pre-Primary grade sheet with observation data will be used."
                : "Standard marksheet template will be used (no observation)."}
            </p>
            <button
              onClick={() => {
                setIncludeObservation(null);
                setObservationMap({});
              }}
              className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline"
            >
              {schoolLevel === "PRE_PRIMARY" ? "Change" : "Change"}
            </button>
          </div>
        )}

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
              No subjects have been submitted by teachers for this exam yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {submittedSubjects.map((subject) => {
                  const comp = teacherCompilations.find(
                    (c) => c.syncedSubjectId === subject.id,
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
                {submittedSubjects.length} subjects)
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
                  onClick={
                    includeObservation
                      ? handleViewAllPrePrimaryGradeSheets
                      : handleViewAllGradeSheets
                  }
                  disabled={isLoadingObservations}
                  variant="outline"
                  className="flex items-center gap-2 h-9 py-2 text-xs font-semibold cursor-pointer"
                >
                  {isLoadingObservations ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {selectedIds.size > 0
                    ? `View Selected (${selectedIds.size})`
                    : "View All Grade Sheets"}
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
                        result.hasReExam &&
                          "bg-amber-50/60 dark:bg-amber-950/20",
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
                        {result.hasReExam && (
                          <span className="ml-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            (Re-exam)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <button
                          onClick={() =>
                            includeObservation
                              ? handleViewPrePrimaryGradeSheet(result)
                              : setShowTranscriptModal(
                                  toStudentObj(
                                    result,
                                    gradeLevel,
                                    students,
                                    examName,
                                  ),
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

      {/* Standard grade sheet modals (no observation) */}
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

      {/* Pre-primary grade sheet modals (with observation) */}
      <PrePrimaryTranscriptModal
        student={prePrimaryModal}
        onClose={() => setPrePrimaryModal(null)}
      />
      {prePrimaryBulk && (
        <PrePrimaryBulkGradeSheetsModal
          students={prePrimaryBulk}
          onClose={() => setPrePrimaryBulk(null)}
        />
      )}
    </motion.div>
  );
}
