"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import {
  Eye,
  CheckCircle,
  AlertTriangle,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import {
  useEvaluationTemplates,
  useStudentEvaluationResults,
} from "@/hooks/use-evaluations";
import { useStudents } from "@/hooks/use-students";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMarksContext } from "@/contexts/marks-context";
import { toast } from "sonner";
import MarkEntrySkeleton from "@/components/teacher/MarkEntrySkeleton";

export default function MarkEntryOverviewTable() {
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: templatesData = [], isLoading: isTemplatesLoading } = useEvaluationTemplates();

  const {
    getStudentMark,
    updateOutcomeMark,
    outcomeColumns,
    handleSaveAll,
    isSaving,
    saveError,
    saved,
    setEvaluations,
  } = useMarksContext();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive base path from the URL — reliable from first render, before profile loads.
  // Avoids isAdmin flickering to false during profile fetch generating wrong teacher URLs.
  const markEntryBase = pathname.startsWith('/admin') ? '/admin/mark-entry' : '/teacher/mark-entry';

  const selectedClass = searchParams.get("class") ?? "";
  const selectedSection = searchParams.get("section") ?? "";
  const selectedSubject = searchParams.get("subject") ?? "";
  const selectedEvalPlan = searchParams.get("eval") ?? "";

  const studentClassFilter = selectedSection
    ? `${selectedClass} - ${selectedSection}`
    : selectedClass;
  const [page, setPage] = useState(1);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [sortField, setSortField] = useState<"rollNumber" | "name">("rollNumber");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const PAGE_SIZE = 10;

  const handleSortClick = (field: "rollNumber" | "name") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents(
    selectedClass ? { class: studentClassFilter, limit: 9999 } : { limit: 1 },
  );

  // For teachers: resolve via their assigned subjects.
  // For admins: they have no syncedTeacher, so fall back to matching templates directly.
  const isAdmin = profile?.role === 'ADMIN';

  const subjectObj = useMemo(() => {
    if (!selectedClass || !selectedSubject) return undefined;
    if (isAdmin) return undefined; // admins use direct template matching
    return profile?.syncedTeacher?.subjects.find(
      (s) =>
        s.name === selectedSubject &&
        s.gradeLevel === selectedClass &&
        (selectedSection ? s.section === selectedSection : true),
    );
  }, [selectedClass, selectedSubject, selectedSection, profile, isAdmin]);

  const allSubjectTemplates = useMemo(() => {
    if (!selectedClass || !selectedSubject) return [];

    // For teachers: match by the teacher's assigned subject ID (exact, reliable)
    if (!isAdmin && subjectObj) {
      return templatesData.filter((t) => t.syncedSubjectId === subjectObj.id);
    }

    // For admin (or fallback when subjectObj not resolved yet):
    // match templates by subject name + grade level + optional section
    return templatesData.filter((t) => {
      if (t.syncedSubject?.name !== selectedSubject) return false;
      const gradeMatches =
        t.syncedSubject?.gradeLevel === selectedClass ||
        t.gradeConfig?.gradeLevel === selectedClass;
      if (!gradeMatches) return false;
      // If a section is in the URL, also filter by section
      if (selectedSection) {
        return t.syncedSubject?.section === selectedSection;
      }
      return true;
    });
  }, [subjectObj, templatesData, isAdmin, selectedClass, selectedSubject, selectedSection]);

  const evaluations = useMemo(() => {
    if (!selectedEvalPlan) return [];
    return allSubjectTemplates.filter((t) => {
      const evalTitleMatch = t.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : "";
      const evalTitle = rawEvalPart.split("|")[0];
      const planTitle = evalTitle || selectedSubject;
      return planTitle === selectedEvalPlan;
    });
  }, [allSubjectTemplates, selectedEvalPlan, selectedSubject]);

  // Push current evaluations to the shared context so it fetches & syncs DB results.
  // Use a ref to compare by ID string — avoids infinite loop from useMemo creating new
  // array references on every render even when the data hasn't changed.
  const prevEvalIdsRef = useRef<string>("");
  useEffect(() => {
    const nextIds = evaluations.map((e) => e.id).join(",");
    if (nextIds !== prevEvalIdsRef.current) {
      prevEvalIdsRef.current = nextIds;
      setEvaluations(evaluations);
    }
  }, [evaluations, setEvaluations]);

  // Fetch DB results for other checks if needed, but DO NOT hide failed students
  const evalIds = useMemo(() => evaluations.map((e) => e.id), [evaluations]);
  const { data: resultsData = [] } = useStudentEvaluationResults(
    evalIds.length > 0 ? { limit: 1000 } : {},
  );

  // Compute the overall status for the current evaluation group
  const evalGroupStatus = useMemo(() => {
    if (evalIds.length === 0 || resultsData.length === 0) return 'NONE';
    const evalIdSet = new Set(evalIds);
    const relevantResults = resultsData.filter(r => evalIdSet.has(r.evaluationTemplateId));
    if (relevantResults.length === 0) return 'NONE';
    if (relevantResults.some(r => r.status === 'SUBMITTED' || r.status === 'VERIFIED' || r.status === 'LOCKED')) return 'SUBMITTED';
    if (relevantResults.some(r => r.status === 'DRAFT')) return 'DRAFT';
    return 'NONE';
  }, [evalIds, resultsData]);

  // Stable list — sorted ONLY by roll number initially. Does NOT depend on marks
  // so it won't re-order while a teacher is entering marks.
  const classStudents = useMemo(() => {
    const students = studentsData?.students ?? [];
    return [...students].sort((a, b) => {
      const rollA = Number(a.rollNumber) || 0;
      const rollB = Number(b.rollNumber) || 0;
      if (rollA !== rollB) return rollA - rollB;
      return (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "");
    });
  }, [studentsData]);

  // Apply the user-selected column sort on top of the stable list
  const sortedStudents = useMemo(() => {
    return [...classStudents].sort((a, b) => {
      let cmp = 0;
      if (sortField === "rollNumber") {
        const rollA = Number(a.rollNumber) || 0;
        const rollB = Number(b.rollNumber) || 0;
        cmp = rollA !== rollB
          ? rollA - rollB
          : (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "");
      } else {
        cmp = (a.name ?? "").localeCompare(b.name ?? "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [classStudents, sortField, sortDir]);

  const handleMarkChange = (
    studentId: string,
    evalId: string,
    outcomeName: string,
    raw: string,
    max: number,
  ) => {
    const num = raw === "" ? null : Math.min(Math.max(0, Number(raw)), max);
    updateOutcomeMark(studentId, evalId, outcomeName, { regularMark: num });
  };

  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / PAGE_SIZE));
  const pagedStudents = sortedStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const isLoading =
    (isProfileLoading || isTemplatesLoading || isStudentsLoading) &&
    !!selectedClass;

  if (isLoading) {
    return <MarkEntrySkeleton />;
  }

  // Validation before publish
  const doPublish = async () => {
    const query = searchParams.toString();
    await handleSaveAll(true);
    router.push(`/teacher/evaluations${query ? `?${query}` : ""}`);
  };

  const handlePublish = async () => {
    // Check 1: any student with missing marks
    const evalIdSet = new Set(evalIds);
    const hasMissingMarks = classStudents.some(student =>
      outcomeColumns.some(col => {
        const mark = getStudentMark(student.id, col.evalId);
        const val = mark?.outcomeMarks[col.name]?.regularMark;
        return val === null || val === undefined;
      })
    );
    if (hasMissingMarks) {
      toast.error("Fill in all marks before publishing. Use Draft to save incomplete marks.");
      return;
    }

    // Check 2: any student failed with no re-exam result
    const failedWithNoReExam = classStudents.filter(student => {
      const studentEvalIds = evalIds.filter(eid => evalIdSet.has(eid));
      const studentResults = resultsData.filter(
        r => studentEvalIds.includes(r.evaluationTemplateId) && r.syncedStudentId === student.id
      );
      const hasFail = outcomeColumns.some(col => {
        const mark = getStudentMark(student.id, col.evalId);
        const val = mark?.outcomeMarks[col.name]?.regularMark;
        return val !== null && val !== undefined && val < col.passMarks;
      });
      const hasReExam = studentResults.some(r => r.reExamResult);
      return hasFail && !hasReExam;
    });

    if (failedWithNoReExam.length > 0) {
      setConfirmPublish(true);
      return;
    }

    await doPublish();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground">Marks Entry</h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {selectedSubject
                ? `${selectedClass} · ${selectedSubject} · ${selectedEvalPlan}`
                : 'Select a class, subject, and evaluation plan to view the mark entry table.'}
            </p>
          </div>
        </div>
      </div>

      {selectedClass &&
        selectedSubject &&
        selectedEvalPlan &&
        evaluations.length === 0 && (
          <div className="bg-white dark:bg-card rounded-xl border border-dashed border-slate-300 dark:border-border p-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No evaluation plan found for <strong>{selectedEvalPlan}</strong>{" "}
              in <strong>{selectedSubject}</strong>.
            </p>
          </div>
        )}

      {/* ── Main table ──────────────────────────────────────────── */}
      {evaluations.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Table header bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">
                  {selectedSubject}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {selectedClass} · {selectedEvalPlan} · {classStudents.length}{" "}
                  student{classStudents.length !== 1 ? "s" : ""}
                  {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`${markEntryBase}/all?class=${selectedClass}&subject=${selectedSubject}${selectedSection ? `&section=${selectedSection}` : ``}&evalId=${evaluations[0].id}`}
                  className="px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Link>
                {!isAdmin && <button
                  onClick={async () => {
                    await handleSaveAll(false);
                    const query = searchParams.toString();
                    router.push(`/teacher/evaluations${query ? `?${query}` : ""}`);
                  }}
                  disabled={isSaving || evalGroupStatus === 'SUBMITTED'}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${evalGroupStatus === 'SUBMITTED'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  {isSaving ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {evalGroupStatus === 'SUBMITTED' ? 'Drafted' : 'Draft'}
                </button>}
                {!isAdmin && <button
                  onClick={handlePublish}
                  disabled={isSaving || evalGroupStatus === 'SUBMITTED'}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${evalGroupStatus === 'SUBMITTED'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                >
                  {isSaving ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {evalGroupStatus === 'SUBMITTED' ? 'Published' : 'Publish'}
                </button>}
              </div>
            </div>

            {classStudents.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">
                No students found in {selectedClass}.
              </p>
            ) : (
              <div className="overflow-x-auto scrollbar-minimal pb-1">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th
                        className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors group"
                        onClick={() => handleSortClick("rollNumber")}
                        title="Sort by Roll No"
                      >
                        <span className="inline-flex items-center gap-1">
                          Roll No
                          <span className="text-[9px] opacity-60 group-hover:opacity-100">
                            {sortField === "rollNumber"
                              ? sortDir === "asc" ? "▲" : "▼"
                              : "⇅"}
                          </span>
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors group"
                        onClick={() => handleSortClick("name")}
                        title="Sort by Student Name"
                      >
                        <span className="inline-flex items-center gap-1">
                          Student Name
                          <span className="text-[9px] opacity-60 group-hover:opacity-100">
                            {sortField === "name"
                              ? sortDir === "asc" ? "▲" : "▼"
                              : "⇅"}
                          </span>
                        </span>
                      </th>
                      {outcomeColumns.map((col) => (
                        <th
                          key={col.evalId}
                          className="px-2 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center whitespace-nowrap"
                        >
                          <div
                            className="max-w-[120px] truncate font-bold text-foreground"
                            title={col.outcomeName}
                          >
                            {col.taskType}
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center whitespace-nowrap">
                        Obtained Marks
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-center whitespace-nowrap">
                        Percentage(%)
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        Result
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider text-center whitespace-nowrap">
                        Re-Exam
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        Detail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-border">
                    {pagedStudents.map((student) => {
                      // ── Per-student calculations ────────────────
                      const totalObtained = outcomeColumns.reduce((sum, col) => {
                        const mark = getStudentMark(student.id, col.evalId);
                        const m = mark?.outcomeMarks[col.name];
                        const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                          ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                          : m?.regularMark;
                        return val !== null && val !== undefined ? sum + val : sum;
                      }, 0);

                      const totalFull = outcomeColumns.reduce(
                        (sum, col) => sum + col.fullMarks,
                        0,
                      );

                      const enteredCount = outcomeColumns.filter((col) => {
                        const mark = getStudentMark(student.id, col.evalId);
                        const m = mark?.outcomeMarks[col.name];
                        const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                          ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                          : m?.regularMark;
                        return val !== null && val !== undefined;
                      }).length;

                      const percentage =
                        totalFull > 0 && enteredCount > 0
                          ? Number(((totalObtained * 100) / totalFull).toFixed(2))
                          : null;

                      // A column fails if mark entered AND below passMarks
                      const failedCols = outcomeColumns.filter((col) => {
                        const mark = getStudentMark(student.id, col.evalId);
                        const m = mark?.outcomeMarks[col.name];
                        const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                          ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                          : m?.regularMark;
                        return val !== null && val !== undefined && val < col.passMarks;
                      });

                      const hasMarks = enteredCount > 0;
                      const anyFail = failedCols.length > 0;

                      let status: "Pass" | "Fail" | "—" = "—";
                      if (hasMarks) {
                        status = anyFail ? "Fail" : "Pass";
                      }

                      return (
                        <tr
                          key={student.id}
                          className={cn(
                            "hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors",
                            anyFail &&
                            hasMarks &&
                            "bg-red-50/40 dark:bg-red-950/10",
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {student.rollNumber}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#002045] dark:text-white whitespace-nowrap">
                            {student.name}
                          </td>

                          {/* ── Mark input cells ── */}
                          {outcomeColumns.map((col) => {
                            const mark = getStudentMark(student.id, col.evalId);
                            const val = mark?.outcomeMarks[col.name]?.regularMark;
                            const isFail =
                              val !== null &&
                              val !== undefined &&
                              val < col.passMarks;

                            return (
                              <td
                                key={col.evalId}
                                className="px-2 py-2 text-center align-middle"
                              >
                                <input
                                  type="number"
                                  min={0}
                                  max={col.fullMarks}
                                  step="any"
                                  value={val ?? ""}
                                  placeholder="—"
                                  readOnly={isAdmin || evalGroupStatus === 'SUBMITTED'}
                                  tabIndex={isAdmin || evalGroupStatus === 'SUBMITTED' ? -1 : 0}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) =>
                                    handleMarkChange(
                                      student.id,
                                      col.evalId,
                                      col.name,
                                      e.target.value,
                                      col.fullMarks,
                                    )
                                  }
                                  className={cn(
                                    "w-16 px-2 py-1.5 text-center text-xs font-bold rounded border-2 focus:outline-none focus:ring-2 transition-colors",
                                    evalGroupStatus === 'SUBMITTED' && "opacity-80 cursor-default",
                                    isFail
                                      ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300 focus:ring-red-400"
                                      : val !== null && val !== undefined
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 focus:ring-emerald-400"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 focus:ring-blue-400",
                                  )}
                                />
                              </td>
                            );
                          })}

                          {/* ── Total ── */}
                          <td className="px-4 py-3 text-center font-bold text-sm text-[#002045] dark:text-white whitespace-nowrap">
                            {hasMarks
                              ? `${Number(totalObtained.toFixed(1))} / ${totalFull}`
                              : "—"}
                          </td>

                          {/* ── Percentage ── */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {percentage !== null ? (
                              <span
                                className={cn(
                                  "inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold",
                                  percentage >= 80
                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                    : percentage >= 50
                                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                                      : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300",
                                )}
                              >
                                {percentage}%
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                status === "Pass"
                                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                  : status === "Fail"
                                    ? "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                              )}
                            >
                              {status}
                            </span>
                          </td>

                          {/* ── Re-Exam ── */}
                          {(() => {
                            // Use local anyFail (live marks) OR server isPassed=false (submitted)
                            const evalIdSet = new Set(evalIds);
                            const studentResults = resultsData.filter(
                              r => evalIdSet.has(r.evaluationTemplateId) && r.syncedStudentId === student.id
                            );

                            // Originally failed based on regular mark < passMarks
                            const localRegularFailedCols = outcomeColumns.filter((col) => {
                              const mark = getStudentMark(student.id, col.evalId);
                              const m = mark?.outcomeMarks[col.name];
                              const val = m?.regularMark;
                              return val !== null && val !== undefined && val < col.passMarks;
                            });

                            const failedEvalIds = new Set<string>([
                              ...localRegularFailedCols.map(c => c.evalId),
                              ...studentResults
                                .filter(
                                  r =>
                                    r.isPassed === false ||
                                    (r.marksObtained !== null &&
                                      Number(r.marksObtained) < Number(r.evaluationTemplate?.passMarks))
                                )
                                .map(r => r.evaluationTemplateId),
                            ]);

                            const totalFailed = failedEvalIds.size;
                            const reExamGiven = outcomeColumns.filter((col) => {
                              if (!failedEvalIds.has(col.evalId)) return false;
                              const mark = getStudentMark(student.id, col.evalId);
                              const m = mark?.outcomeMarks[col.name];
                              if (m?.reExamMark !== null && m?.reExamMark !== undefined) return true;
                              const r = studentResults.find(res => res.evaluationTemplateId === col.evalId);
                              return !!r?.reExamResult;
                            }).length;

                            if (totalFailed === 0) {
                              return (
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span className="text-slate-400 text-xs">—</span>
                                </td>
                              );
                            }

                            if (reExamGiven === 0) {
                              return (
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                                    Needed
                                  </span>
                                </td>
                              );
                            }

                            if (reExamGiven < totalFailed) {
                              return (
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                                    {reExamGiven}/{totalFailed} Given
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                                  Given
                                </span>
                              </td>
                            );
                          })()}

                          {/* ── Detail link ── */}
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`${markEntryBase}/${student.id}?evalId=${evaluations[0].id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-border transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Pagination footer (always visible) ── */}
            <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
              <p className="text-[11px] text-muted-foreground">
                Showing{" "}
                {Math.min((page - 1) * PAGE_SIZE + 1, sortedStudents.length)}–
                {Math.min(page * PAGE_SIZE, sortedStudents.length)} of{" "}
                {sortedStudents.length} student
                {sortedStudents.length !== 1 ? "s" : ""}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                    )
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                        acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span
                          key={`ell-${i}`}
                          className="px-1 text-muted-foreground text-xs"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={cn(
                            "h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md text-xs font-semibold transition-colors border",
                            page === p
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
                          )}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold text-sm"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile View */}
          <div className="flex sm:hidden flex-col gap-4 pb-4">
            {/* Mobile Header Card */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedSubject}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedClass} · {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {!isAdmin && <button
                  onClick={handlePublish}
                  disabled={isSaving || evalGroupStatus === 'SUBMITTED'}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${evalGroupStatus === 'SUBMITTED'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  <Send className="w-3.5 h-3.5" /> Publish
                </button>}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`${markEntryBase}/all?class=${selectedClass}&subject=${selectedSubject}${selectedSection ? `&section=${selectedSection}` : ``}&evalId=${evaluations[0].id}`}
                  className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                >
                  <Eye className="w-3.5 h-3.5" /> View details
                </Link>
                {!isAdmin && <button
                  onClick={async () => {
                    await handleSaveAll(false);
                    const query = searchParams.toString();
                    router.push(`/teacher/evaluations${query ? `?${query}` : ""}`);
                  }}
                  disabled={isSaving || evalGroupStatus === 'SUBMITTED'}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${evalGroupStatus === 'SUBMITTED'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Save className="w-3.5 h-3.5" /> Draft
                </button>}
              </div>
            </div>

            {/* Mobile Student Cards */}
            {classStudents.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
                <p className="text-sm text-muted-foreground">No students found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pagedStudents.map((student) => {
                  const totalObtained = outcomeColumns.reduce((sum, col) => {
                    const mark = getStudentMark(student.id, col.evalId);
                    const m = mark?.outcomeMarks[col.name];
                    const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                      ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                      : m?.regularMark;
                    return val !== null && val !== undefined ? sum + val : sum;
                  }, 0);
                  const totalFull = outcomeColumns.reduce((sum, col) => sum + col.fullMarks, 0);
                  const enteredCount = outcomeColumns.filter((col) => {
                    const mark = getStudentMark(student.id, col.evalId);
                    const m = mark?.outcomeMarks[col.name];
                    const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                      ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                      : m?.regularMark;
                    return val !== null && val !== undefined;
                  }).length;
                  const percentage = totalFull > 0 && enteredCount > 0 ? Number(((totalObtained * 100) / totalFull).toFixed(2)) : null;
                  const failedCols = outcomeColumns.filter((col) => {
                    const mark = getStudentMark(student.id, col.evalId);
                    const m = mark?.outcomeMarks[col.name];
                    const val = m?.reExamMark !== null && m?.reExamMark !== undefined
                      ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                      : m?.regularMark;
                    return val !== null && val !== undefined && val < col.passMarks;
                  });
                  const hasMarks = enteredCount > 0;
                  const anyFail = failedCols.length > 0;
                  let status: "Pass" | "Fail" | "—" = "—";
                  if (hasMarks) status = anyFail ? "Fail" : "Pass";

                  const evalIdSet = new Set(evalIds);
                  const studentResults = resultsData.filter(r => evalIdSet.has(r.evaluationTemplateId) && r.syncedStudentId === student.id);

                  // Originally failed based on regular mark < passMarks
                  const localRegularFailedCols = outcomeColumns.filter((col) => {
                    const mark = getStudentMark(student.id, col.evalId);
                    const m = mark?.outcomeMarks[col.name];
                    const val = m?.regularMark;
                    return val !== null && val !== undefined && val < col.passMarks;
                  });

                  const failedEvalIds = new Set<string>([
                    ...localRegularFailedCols.map(c => c.evalId),
                    ...studentResults
                      .filter(
                        r =>
                          r.isPassed === false ||
                          (r.marksObtained !== null &&
                            Number(r.marksObtained) < Number(r.evaluationTemplate?.passMarks))
                      )
                      .map(r => r.evaluationTemplateId),
                  ]);

                  const totalFailed = failedEvalIds.size;
                  const reExamGiven = outcomeColumns.filter((col) => {
                    if (!failedEvalIds.has(col.evalId)) return false;
                    const mark = getStudentMark(student.id, col.evalId);
                    const m = mark?.outcomeMarks[col.name];
                    if (m?.reExamMark !== null && m?.reExamMark !== undefined) return true;
                    const r = studentResults.find(res => res.evaluationTemplateId === col.evalId);
                    return !!r?.reExamResult;
                  }).length;

                  return (
                    <div key={student.id} className="bg-card rounded-xl border border-border shadow-sm p-4 flex flex-col gap-4">
                      {/* Top Row: Avatar, Info, View Btn */}
                      <div className="flex justify-between items-center pb-3 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground leading-tight">{student.name}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Roll no. {student.rollNumber}</p>
                          </div>
                        </div>
                        <Link
                          href={`${markEntryBase}/${student.id}?evalId=${evaluations[0].id}`}
                          className="px-3 py-1.5 border border-border rounded-lg text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </div>

                      {/* Dimensions Input Grid */}
                      <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-minimal">
                        {outcomeColumns.map(col => {
                          const mark = getStudentMark(student.id, col.evalId);
                          const val = mark?.outcomeMarks[col.name]?.regularMark;
                          const isFail = val !== null && val !== undefined && val < col.passMarks;
                          return (
                            <div key={col.evalId} className="flex flex-col gap-1.5 shrink-0" style={{ width: 'calc(50% - 4px)', minWidth: '100px' }}>
                              <label className="text-[9px] font-extrabold text-muted-foreground uppercase truncate px-1" title={col.taskType}>
                                {col.taskType}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={col.fullMarks}
                                step="any"
                                value={val ?? ""}
                                placeholder="—"
                                readOnly={isAdmin || evalGroupStatus === 'SUBMITTED'}
                                tabIndex={isAdmin || evalGroupStatus === 'SUBMITTED' ? -1 : 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => handleMarkChange(student.id, col.evalId, col.name, e.target.value, col.fullMarks)}
                                className={cn(
                                  "w-full text-center bg-transparent border rounded-lg py-1.5 text-xs font-bold focus:ring-1 focus:outline-none transition-colors",
                                  evalGroupStatus === 'SUBMITTED' && "opacity-80 cursor-default",
                                  isFail ? "border-red-500/30 text-red-500 focus:ring-red-400" : val !== null && val !== undefined ? "border-border text-foreground focus:ring-primary" : "border-border/50 text-muted-foreground focus:ring-primary"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary Row */}
                      <div className="flex justify-between items-end pt-3 border-t border-border/50">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Obtained</span>
                          <span className="font-bold text-xs text-foreground">{hasMarks ? totalObtained : "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Percent</span>
                          <span className="font-bold text-xs text-blue-500">{percentage ? `${percentage}%` : "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Result</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            status === 'Pass' ? 'bg-emerald-500/10 text-emerald-500' : status === 'Fail' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-400'
                          )}>
                            {status === "—" ? "—" : status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase">Re-Exam</span>
                          <span className="font-bold text-xs text-amber-500">
                            {totalFailed > 0 ? (reExamGiven >= totalFailed ? 'Given' : `${reExamGiven}/${totalFailed}`) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mobile Pagination Footer */}
            <div className="py-2 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                {Math.min((page - 1) * PAGE_SIZE + 1, classStudents.length)}–{Math.min(page * PAGE_SIZE, classStudents.length)} of {classStudents.length}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground font-bold text-sm">‹</button>
                  <button onClick={() => setPage((p) => Math.max(totalPages, p + 1))} disabled={page === totalPages} className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground font-bold text-sm">›</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Toast notifications ─────────────────────────────────── */}
      <AnimatePresence>
        {saved && !saveError && (
          <motion.div
            key="saved-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 p-4 bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle className="w-5 h-5" />
            Marks saved successfully!
          </motion.div>
        )}
        {saveError && (
          <motion.div
            key="error-toast"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 p-4 bg-red-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50 max-w-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Publish confirmation dialog ─────────────────────────── */}
      {confirmPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-foreground">Students have failed marks</p>
                <p className="text-xs text-muted-foreground mt-1">
                  One or more students have failed outcomes with no re-exam recorded. Publishing will lock these failed marks permanently.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmPublish(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted transition-colors"
              >
                Cancel (Save Draft)
              </button>
              <button
                onClick={async () => { setConfirmPublish(false); await doPublish(); }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Publish Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
