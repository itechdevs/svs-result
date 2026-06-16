"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Eye, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import {
  useEvaluationTemplates,
  useStudentEvaluationResults,
  useBulkSaveMarks,
} from "@/hooks/use-evaluations";
import { useStudents } from "@/hooks/use-students";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { StudentOutcomeMark, OutcomeMark } from "@/types/academic";

export default function MarkEntryOverviewTable() {
  const { data: profile } = useProfile();
  const { data: templatesData = [] } = useEvaluationTemplates();
  const bulkSave = useBulkSaveMarks();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") ?? "",
  );
  const [selectedSubject, setSelectedSubject] = useState(
    searchParams.get("subject") ?? "",
  );
  const [selectedEvalPlan, setSelectedEvalPlan] = useState(
    searchParams.get("eval") ?? "",
  );
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark[]>([]);

  const { data: studentsData } = useStudents(
    selectedClass ? { grade: selectedClass, limit: 9999 } : { limit: 1 },
  );

  // Assigned classes from syncedTeacher.subjects
  const assignedClasses = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    return Array.from(new Set(subjects.map((s) => s.gradeLevel)));
  }, [profile]);

  // Subjects for selected class
  const subjects = useMemo(() => {
    const teacherSubjects = profile?.syncedTeacher?.subjects ?? [];
    return teacherSubjects
      .filter((s) => s.gradeLevel === selectedClass)
      .map((s) => s.name);
  }, [selectedClass, profile]);

  // All evaluation templates for selected class+subject (multiple per subject)
  const subjectObj = useMemo(() => {
    if (!selectedClass || !selectedSubject) return undefined;
    return profile?.syncedTeacher?.subjects.find(
      (s) => s.name === selectedSubject && s.gradeLevel === selectedClass,
    );
  }, [selectedClass, selectedSubject, profile]);

  const allSubjectTemplates = useMemo(() => {
    if (!subjectObj) return [];
    return templatesData.filter((t) => t.syncedSubjectId === subjectObj.id);
  }, [subjectObj, templatesData]);

  const evalPlans = useMemo(() => {
    const plans = new Set<string>();
    for (const t of allSubjectTemplates) {
      const evalTitleMatch = t.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : "";
      const evalTitle = rawEvalPart.split("|")[0];
      plans.add(evalTitle || selectedSubject);
    }
    return Array.from(plans);
  }, [allSubjectTemplates, selectedSubject]);

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

  // Students for selected class
  const classStudents = useMemo(
    () => studentsData?.students ?? [],
    [studentsData],
  );

  // All template IDs in this evaluation group (Listening, Speaking, Reading, Writing…)
  const evalIds = useMemo(() => evaluations.map((e) => e.id), [evaluations]);

  // Fetch results for ALL templates in this evaluation group (not just the first one)
  // No templateId filter — fetch all, then filter client-side by evalIds
  const { data: resultsData = [] } = useStudentEvaluationResults(
    evalIds.length > 0 ? { limit: 1000 } : {},
  );

  // Sync DB results into local marks for ALL sub-criteria templates
  useEffect(() => {
    if (evaluations.length === 0 || resultsData.length === 0) return;

    // Build a map of templateId -> template for fast lookup
    const evalMap = new Map(evaluations.map((e) => [e.id, e]));
    const evalIdSet = new Set(evalIds);

    // Map each result row to a StudentOutcomeMark entry keyed by studentId + templateId
    const mapped: StudentOutcomeMark[] = [];
    for (const r of resultsData) {
      if (!evalIdSet.has(r.evaluationTemplateId)) continue;
      const template = evalMap.get(r.evaluationTemplateId);
      if (!template) continue;
      mapped.push({
        studentId: r.syncedStudentId,
        evaluationId: r.evaluationTemplateId,
        outcomeMarks: {
          [template.name]: {
            regularMark:
              r.marksObtained !== null && r.marksObtained !== undefined
                ? Number(r.marksObtained)
                : null,
            regularDate: r.submittedAt
              ? new Date(r.submittedAt).toISOString().split("T")[0]
              : "",
            supportMark: null,
            supportDate: "",
            reExamMark: null,
            reExamDate: "",
            remarks: r.remarks ?? "",
          },
        },
      });
    }

    setLocalMarks(mapped);
  }, [resultsData, evalIds.join(",")]);


  const getStudentMark = useCallback(
    (studentId: string, evalId: string) =>
      localMarks.find(
        (m) => m.studentId === studentId && m.evaluationId === evalId,
      ),
    [localMarks],
  );

  const updateOutcomeMark = useCallback(
    (
      studentId: string,
      evalId: string,
      outcomeName: string,
      patch: Partial<OutcomeMark>,
    ) => {
      setLocalMarks((prev) => {
        const idx = prev.findIndex(
          (m) => m.studentId === studentId && m.evaluationId === evalId,
        );
        if (idx === -1) {
          return [
            ...prev,
            {
              studentId,
              evaluationId: evalId,
              outcomeMarks: {
                [outcomeName]: {
                  regularMark: null,
                  regularDate: "",
                  supportMark: null,
                  supportDate: "",
                  reExamMark: null,
                  reExamDate: "",
                  remarks: "",
                  ...patch,
                },
              },
            },
          ];
        }
        const updated = [...prev];
        const existing = updated[idx].outcomeMarks[outcomeName] ?? {
          regularMark: null,
          regularDate: "",
          supportMark: null,
          supportDate: "",
          reExamMark: null,
          reExamDate: "",
          remarks: "",
        };
        updated[idx] = {
          ...updated[idx],
          outcomeMarks: {
            ...updated[idx].outcomeMarks,
            [outcomeName]: { ...existing, ...patch },
          },
        };
        return updated;
      });
    },
    [],
  );

  const handleSaveAll = async () => {
    if (evaluations.length === 0) return;
    setSaveError(null);
    try {
      for (const t of evaluations) {
        const relevantMarks = localMarks.filter((m) => m.evaluationId === t.id);
        if (relevantMarks.length === 0) continue;
        await bulkSave.mutateAsync({
          evaluationTemplateId: t.id,
          results: relevantMarks.map((m) => {
            const obtained = m.outcomeMarks[t.name]?.regularMark;
            return {
              syncedStudentId: m.studentId,
              marksObtained:
                obtained !== null && obtained !== undefined ? obtained : undefined,
              isAbsent: false,
              remarks: m.outcomeMarks[t.name]?.remarks || undefined,
            };
          }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed. Please try again.';
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    }
  };

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

  const updateURL = (c: string, s: string, e: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (c) params.set("class", c);
    else params.delete("class");
    if (s) params.set("subject", s);
    else params.delete("subject");
    if (e) params.set("eval", e);
    else params.delete("eval");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubject("");
    setSelectedEvalPlan("");
    updateURL(value, "", "");
  };
  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setSelectedEvalPlan("");
    updateURL(selectedClass, value, "");
  };
  const handleEvalPlanChange = (value: string) => {
    setSelectedEvalPlan(value);
    updateURL(selectedClass, selectedSubject, value);
  };

  // Build outcome columns: one per template in the evaluation group
  // Parse task type and outcome label from the template name pattern:
  //   [EvalTitle|UnitTitle][TaskType] OutcomeName  →  taskType = "Listening" etc.
  const outcomeColumns = useMemo(
    () =>
      evaluations.map((t) => {
        const newFormat = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFormat = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFormat
          ? newFormat[1]
          : legacyFormat
            ? legacyFormat[1]
            : t.name;
        const outcomeName = newFormat
          ? newFormat[2]
          : legacyFormat
            ? legacyFormat[2]
            : t.name;
        return {
          evalId: t.id,
          name: t.name,       // full key used for outcomeMarks lookup
          taskType,            // shown in column header
          outcomeName,         // shown in tooltip
          fullMarks: Number(t.fullMarks),
          passMarks: Number(t.passMarks),
        };
      }),
    [evaluations],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
        <h1 className="text-lg font-bold text-[#002045] dark:text-white mb-4">
          Mark Entry
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Class
            </label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Subject
            </label>
            <Select
              value={selectedSubject}
              onValueChange={handleSubjectChange}
              disabled={!selectedClass}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue
                  placeholder={
                    selectedClass
                      ? "Select a subject..."
                      : "Select a class first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Evaluation Plan
            </label>
            <Select
              value={selectedEvalPlan}
              onValueChange={handleEvalPlanChange}
              disabled={!selectedSubject || evalPlans.length === 0}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue
                  placeholder={
                    !selectedSubject
                      ? "Select a subject first"
                      : evalPlans.length === 0
                        ? "No plans available"
                        : "Select a plan..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {evalPlans.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {(!selectedClass || !selectedSubject || !selectedEvalPlan) && (
        <div className="bg-white dark:bg-card rounded-xl border border-dashed border-slate-300 dark:border-border p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a class, subject, and evaluation plan to view the mark entry
            table.
          </p>
        </div>
      )}

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

      {evaluations.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-border">
            <div>
              <p className="font-bold text-sm text-[#002045] dark:text-white">
                {selectedSubject}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedClass} · {selectedSubject} · {classStudents.length}{" "}
                student{classStudents.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={bulkSave.isPending}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              {bulkSave.isPending ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save All'
              )}
            </button>
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
                        {/* Show Task Type (e.g. Listening) as the column header */}
                        <div
                          className="max-w-[120px] truncate font-bold text-[#002045] dark:text-blue-300"
                          title={col.outcomeName}
                        >
                          {col.taskType}
                        </div>
                        {/* <div className="text-[9px] font-normal text-slate-400 normal-case">
                          /{col.fullMarks} · pass {col.passMarks}
                        </div> */}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-4 py-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-center whitespace-nowrap">
                      % (Percentage)
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
                  {classStudents.map((student) => {
                    // Only count entered (non-null) marks in the numerator
                    const totalObtained = outcomeColumns.reduce((sum, col) => {
                      const mark = getStudentMark(student.id, col.evalId);
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return val !== null && val !== undefined ? sum + val : sum;
                    }, 0);
                    const totalFull = outcomeColumns.reduce(
                      (sum, col) => sum + col.fullMarks,
                      0,
                    );
                    // Count how many sub-criteria have marks entered
                    const enteredCount = outcomeColumns.filter((col) => {
                      const mark = getStudentMark(student.id, col.evalId);
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return val !== null && val !== undefined;
                    }).length;
                    // Percentage = (Total Obtained × 100) ÷ (Total Full Marks of ALL sub-criteria)
                    const percentage =
                      totalFull > 0 && enteredCount > 0
                        ? Number(((totalObtained * 100) / totalFull).toFixed(2))
                        : null;
                    const anyFail = outcomeColumns.some((col) => {
                      const mark = getStudentMark(student.id, col.evalId);
                      const val = mark?.outcomeMarks[col.name]?.regularMark;
                      return (
                        val !== null && val !== undefined && val < col.passMarks
                      );
                    });
                    const hasMarks = enteredCount > 0;
                    const status = !hasMarks ? "—" : anyFail ? "Fail" : "Pass";
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {student.rollNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#002045] dark:text-white whitespace-nowrap">
                          {student.name}
                        </td>
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
                              className="px-2 py-3 text-center"
                            >
                              <input
                                type="number"
                                min={0}
                                max={col.fullMarks}
                                step="any"
                                value={val ?? ""}
                                placeholder="—"
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
                                  "w-16 px-2 py-1.5 text-center text-xs font-bold rounded border-2 focus:outline-none focus:ring-2",
                                  isFail
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300 focus:ring-red-400"
                                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 focus:ring-emerald-400",
                                )}
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-bold text-sm text-[#002045] dark:text-white whitespace-nowrap">
                          {hasMarks ? `${totalObtained} / ${totalFull}` : '—'}
                        </td>
                        {/* Percentage column */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {percentage !== null ? (
                            <span className={cn(
                              "inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold",
                              percentage >= 80
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                : percentage >= 50
                                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                                  : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
                            )}>
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
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/teacher/mark-entry/${student.id}?evalId=${evaluations[0].id}`}
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
        </div>
      )}

      {saved && !saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50"
        >
          <CheckCircle className="w-5 h-5" />
          Marks saved successfully!
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-red-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50 max-w-sm"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {saveError}
        </motion.div>
      )}
    </motion.div>
  );
}
