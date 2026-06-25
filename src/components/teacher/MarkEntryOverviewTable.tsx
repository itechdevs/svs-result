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
import { useSearchParams, useRouter } from "next/navigation";
import { useMarksContext } from "@/contexts/marks-context";

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

  const selectedClass = searchParams.get("class") ?? "";
  const selectedSubject = searchParams.get("subject") ?? "";
  const selectedEvalPlan = searchParams.get("eval") ?? "";
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents(
    selectedClass ? { class: selectedClass, limit: 9999 } : { limit: 1 },
  );

  // For teachers: resolve via their assigned subjects.
  // For admins: they have no syncedTeacher, so fall back to matching templates directly.
  const isAdmin = profile?.role === 'ADMIN';

  const subjectObj = useMemo(() => {
    if (!selectedClass || !selectedSubject) return undefined;
    if (isAdmin) return undefined; // admins use direct template matching
    return profile?.syncedTeacher?.subjects.find(
      (s) => s.name === selectedSubject && s.gradeLevel === selectedClass,
    );
  }, [selectedClass, selectedSubject, profile, isAdmin]);

  const allSubjectTemplates = useMemo(() => {
    if (!selectedClass || !selectedSubject) return [];
    // Admin: match templates by subject name + grade level directly
    if (isAdmin) {
      return templatesData.filter(
        (t) =>
          t.syncedSubject?.name === selectedSubject &&
          (t.syncedSubject?.gradeLevel === selectedClass || t.gradeConfig?.gradeLevel === selectedClass),
      );
    }
    if (!subjectObj) return [];
    return templatesData.filter((t) => t.syncedSubjectId === subjectObj.id);
  }, [subjectObj, templatesData, isAdmin, selectedClass, selectedSubject]);

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

  const classStudents = useMemo(
    () => studentsData?.students ?? [],
    [studentsData],
  );

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

  const totalPages = Math.max(1, Math.ceil(classStudents.length / PAGE_SIZE));
  const pagedStudents = classStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const isLoading =
    (isProfileLoading || isTemplatesLoading || isStudentsLoading) &&
    !!selectedClass;

  if (isLoading) {
    return <MarkEntrySkeleton />;
  }

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
            <h1 className="text-base sm:text-lg font-bold text-foreground">Mark Entry</h1>
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
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
          {/* Table header bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-border">
            <div className="min-w-0">
              <p className="font-bold text-sm text-[#002045] dark:text-white truncate">
                {selectedSubject}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedClass} · {selectedEvalPlan} · {classStudents.length}{" "}
                student{classStudents.length !== 1 ? "s" : ""}
                {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={isAdmin
                  ? `/admin/mark-entry/all?class=${selectedClass}&evalId=${evaluations[0].id}`
                  : `/teacher/mark-entry/all?class=${selectedClass}&evalId=${evaluations[0].id}`}
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
                onClick={async () => {
                  await handleSaveAll(true);
                  const query = searchParams.toString();
                  router.push(`/teacher/evaluations${query ? `?${query}` : ""}`);
                }}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Roll No
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    {outcomeColumns.map((col) => (
                      <th
                        key={col.evalId}
                        className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap"
                      >
                        <div
                          className="max-w-[120px] truncate font-bold text-[#002045] dark:text-blue-300"
                          title={col.outcomeName}
                        >
                          {col.taskType}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Obtained Marks
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-center whitespace-nowrap">
                      Percentage(%)
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Result
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
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return val !== null && val !== undefined
                        ? sum + val
                        : sum;
                    }, 0);

                    const totalFull = outcomeColumns.reduce(
                      (sum, col) => sum + col.fullMarks,
                      0,
                    );

                    const enteredCount = outcomeColumns.filter((col) => {
                      const mark = getStudentMark(student.id, col.evalId);
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return val !== null && val !== undefined;
                    }).length;

                    const percentage =
                      totalFull > 0 && enteredCount > 0
                        ? Number(((totalObtained * 100) / totalFull).toFixed(2))
                        : null;

                    // A column fails if mark entered AND below passMarks
                    const failedCols = outcomeColumns.filter((col) => {
                      const mark = getStudentMark(student.id, col.evalId);
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return (
                        val !== null && val !== undefined && val < col.passMarks
                      );
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
                          {hasMarks ? `${totalObtained} / ${totalFull}` : "—"}
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

                        {/* ── Detail link ── */}
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={isAdmin
                              ? `/admin/mark-entry/${student.id}?evalId=${evaluations[0].id}`
                              : `/teacher/mark-entry/${student.id}?evalId=${evaluations[0].id}`}
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
              {Math.min((page - 1) * PAGE_SIZE + 1, classStudents.length)}–
              {Math.min(page * PAGE_SIZE, classStudents.length)} of{" "}
              {classStudents.length} student
              {classStudents.length !== 1 ? "s" : ""}
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
    </motion.div>
  );
}
