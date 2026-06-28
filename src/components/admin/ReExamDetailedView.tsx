"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Calendar, Save } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useStudentEvaluationResults } from "@/hooks/use-evaluations";
import { useReExamAssessment } from "@/hooks/use-re-exams";
import { calcFullMarks } from "@/components/teacher/DetailedMarkEntryView";
import { Student, EvaluationPlan, StudentOutcomeMark, OutcomeMark } from "@/types/academic";
import { Input } from "@/components/shared/ui/input";
import SanskarLoader from "@/components/shared/SanskarLoader";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/shared/ui/table";

interface Props {
  student: Student;
  evaluation: EvaluationPlan;
  backHref?: string;
}

export default function ReExamDetailedView({ student, evaluation, backHref = "admin/re-exam-portal" }: Props) {
  const router = useRouter();

  const templateIds = evaluation.learningOutcomes
    .map(lo => lo.templateId)
    .filter((id): id is string => !!id);

  const { data: resultsData = [], isLoading } = useStudentEvaluationResults({
    syncedStudentId: student.id,
    evaluationTemplateIds: templateIds.length > 0 ? templateIds : undefined,
    limit: 500,
  });

  const reExamAssessment = useReExamAssessment();
  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [shakeSave, setShakeSave] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (resultsData.length === 0 || hasInitialized.current) return;
    const byTemplateId = new Map(resultsData.map(r => [r.evaluationTemplateId, r]));
    const outcomeMarks: Record<string, OutcomeMark> = {};
    for (const lo of evaluation.learningOutcomes) {
      const r = lo.templateId ? byTemplateId.get(lo.templateId) : undefined;
      outcomeMarks[lo.name] = {
        regularMark: r?.marksObtained ?? null,
        regularDate: r?.submittedAt ? new Date(r.submittedAt).toISOString().split("T")[0] : "",
        supportMark: null,
        supportDate: "",
        reExamMark: r?.reExamResult?.marksObtained ?? null,
        reExamDate: (r?.reExamResult as any)?.reExamEnrollment?.reExamSchedule?.scheduledDate
          ? new Date((r?.reExamResult as any)?.reExamEnrollment?.reExamSchedule?.scheduledDate).toISOString().split("T")[0]
          : r?.reExamResult?.createdAt
            ? new Date(r?.reExamResult.createdAt).toISOString().split("T")[0]
            : "",
        remarks: r?.reExamResult?.remarks ?? r?.remarks ?? "",
      };
    }
    setLocalMarks({ studentId: student.id, evaluationId: evaluation.id, outcomeMarks });
    hasInitialized.current = true;
  }, [resultsData, student.id, evaluation.id, evaluation.learningOutcomes]);

  const updateMark = useCallback((outcomeName: string, patch: Partial<OutcomeMark>) => {
    setIsDirty(true);
    setLocalMarks(prev => {
      const existing = prev?.outcomeMarks[outcomeName] ?? {
        regularMark: null, regularDate: "", supportMark: null,
        supportDate: "", reExamMark: null, reExamDate: "", remarks: "",
      };
      return {
        studentId: student.id,
        evaluationId: evaluation.id,
        outcomeMarks: { ...(prev?.outcomeMarks ?? {}), [outcomeName]: { ...existing, ...patch } },
      };
    });
  }, [student.id, evaluation.id]);

  const saveAll = useCallback((marks: StudentOutcomeMark) => {
    const outcomes = evaluation.learningOutcomes;
    const toSave = outcomes.filter(lo => {
      const m = marks.outcomeMarks[lo.name];
      return lo.templateId && m?.reExamMark !== null && m?.reExamMark !== undefined;
    });

    if (toSave.length === 0) return;

    setSaveStatus("saving");
    let remaining = toSave.length;
    let hasError = false;

    for (const lo of toSave) {
      const m = marks.outcomeMarks[lo.name];
      reExamAssessment.mutate(
        {
          evaluationTemplateId: lo.templateId!,
          syncedStudentId: student.id,
          marksObtained: m.reExamMark!,
          scheduledDate: m.reExamDate || new Date().toISOString(),
          remarks: m.remarks,
        },
        {
          onSuccess: () => {
            remaining--;
            if (remaining === 0 && !hasError) {
              setSaveStatus("saved");
              setIsDirty(false);
              toast.success("Re-exam marks saved");
              setTimeout(() => setSaveStatus("idle"), 2500);
            }
          },
          onError: () => {
            if (!hasError) {
              hasError = true;
              setSaveStatus("error");
              toast.error("Failed to save re-exam marks");
              setTimeout(() => setSaveStatus("idle"), 3000);
            }
          },
        },
      );
    }
  }, [evaluation.learningOutcomes, student.id, reExamAssessment]);

  const handleSave = useCallback(() => {
    if (!localMarks) return;
    saveAll(localMarks);
  }, [localMarks, saveAll]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      const hasEnteredMarks = evaluation.learningOutcomes.some(lo => {
        const m = localMarks?.outcomeMarks[lo.name];
        return m?.reExamMark !== null && m?.reExamMark !== undefined;
      });
      if (hasEnteredMarks) {
        toast.warning("Please save before going back", { duration: 3000 });
        setShakeSave(true);
        setTimeout(() => setShakeSave(false), 600);
        return;
      }
    }
    router.push(backHref);
  }, [isDirty, localMarks, evaluation.learningOutcomes, router, backHref]);

  const handleReExamMark = (outcomeName: string, value: string, max: number) => {
    const num = value === "" ? null : Math.min(Math.max(0, Number(value)), max);
    updateMark(outcomeName, { reExamMark: num });
  };
  const handleReExamDate = (outcomeName: string, value: string) => {
    updateMark(outcomeName, { reExamDate: value });
  };
  const handleRemarks = (outcomeName: string, value: string) => {
    updateMark(outcomeName, { remarks: value });
  };

  const outcomes = evaluation.learningOutcomes;
  const obtained = outcomes.reduce((sum, lo) => {
    const m = localMarks?.outcomeMarks[lo.name];
    return sum + Number(m?.reExamMark ?? m?.regularMark ?? 0);
  }, 0);
  const fullTotal = calcFullMarks(outcomes);

  const status = (() => {
    const anyEntered = outcomes.some(lo => {
      const m = localMarks?.outcomeMarks[lo.name];
      return m?.regularMark !== null && m?.regularMark !== undefined;
    });
    if (!anyEntered) return "Pending";
    const anyFail = outcomes.some(lo => {
      const m = localMarks?.outcomeMarks[lo.name];
      const finalMark = m?.reExamMark ?? m?.regularMark;
      if (finalMark === null || finalMark === undefined) return false;
      return finalMark < (lo.passMarks ?? 0);
    });
    if (anyFail) return "Fail";
    const allEntered = outcomes.every(lo => {
      const m = localMarks?.outcomeMarks[lo.name];
      return m?.regularMark !== null && m?.regularMark !== undefined;
    });
    if (!allEntered) return "Pending";
    return "Pass";
  })();

  const failedOutcomes = outcomes.filter(lo => {
    const m = localMarks?.outcomeMarks[lo.name];
    return m?.regularMark !== null && m?.regularMark !== undefined && m.regularMark < (lo.passMarks ?? 0);
  });

  if (isLoading) return <SanskarLoader message="Loading re-exam details..." />;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card text-card-foreground p-4 rounded-xl border border-border shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-1.5 hover:bg-muted rounded-full transition-colors border border-border">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <h2 className="font-bold text-sm text-foreground">{student.name} - Re-Exam Entry</h2>
            <p className="text-[11px] text-muted-foreground">{student.rollNo} · {evaluation.subject} · {evaluation.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            animate={shakeSave ? { x: [0, -6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border",
              saveStatus === "saved"
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                : saveStatus === "error"
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : saveStatus === "saving"
                    ? "opacity-60 cursor-not-allowed bg-muted text-muted-foreground border-border"
                    : isDirty
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80",
            )}
          >
            {saveStatus === "saved" ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
            ) : saveStatus === "saving" ? (
              <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving...</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Re-Exam Entry Table */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-destructive/5 to-orange-500/5 dark:from-destructive/10 dark:to-orange-500/10">
          <h3 className="text-sm font-bold text-foreground">Failed Outcomes - Re-Exam Assessment</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Only showing outcomes where the student failed. Enter re-exam date, marks and remarks per outcome.</p>
        </div>
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/50 to-muted/80 hover:bg-muted/60">
                <TableHead className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border h-auto">Task Type</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border h-auto">Learning Outcome</TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center border-r border-border h-auto">Full / Pass</TableHead>
                <TableHead className="px-3 py-3 text-[10px] font-bold text-destructive uppercase tracking-wider text-center border-r border-border bg-destructive/5 h-auto">Original Mark</TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-border bg-emerald-50/30 dark:bg-emerald-950/10 h-auto" colSpan={2}>
                  Re-Exam Assessment
                </TableHead>
                <TableHead className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-auto">Remarks</TableHead>
              </TableRow>
              <TableRow className="bg-muted/40 text-[9px] font-semibold text-muted-foreground uppercase hover:bg-muted/50">
                <TableHead className="px-4 py-2 border-r border-border h-8" />
                <TableHead className="px-4 py-2 border-r border-border h-8" />
                <TableHead className="px-3 py-2 text-center border-r border-border h-8" />
                <TableHead className="px-3 py-2 text-center border-r border-border h-8 bg-destructive/5" />
                <TableHead className="px-3 py-2 text-center border-r border-border bg-emerald-50/40 dark:bg-emerald-950/10 h-8">
                  <Calendar className="w-3 h-3 inline mr-1" />Date
                </TableHead>
                <TableHead className="px-3 py-2 text-center border-r border-border bg-emerald-50/40 dark:bg-emerald-950/10 h-8">Marks</TableHead>
                <TableHead className="px-4 py-2 h-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedOutcomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No failed outcomes found. Marks may not have been entered yet.
                  </TableCell>
                </TableRow>
              ) : (
                failedOutcomes.map(lo => {
                  const m = localMarks?.outcomeMarks[lo.name];
                  const max = lo.fullMarks ?? 100;
                  const pass = lo.passMarks ?? 0;
                  const originalMark = m?.regularMark ?? 0;
                  const reExamMark = m?.reExamMark;
                  const finalMark = reExamMark ?? originalMark;
                  const isPassing = finalMark >= pass;

                  return (
                    <TableRow key={lo.name} className="hover:bg-muted/20">
                      <TableCell className="px-4 py-4 border-r border-border whitespace-nowrap">
                        <span className="text-xs font-bold text-foreground">{lo.taskType}</span>
                      </TableCell>
                      <TableCell className="px-4 py-4 border-r border-border whitespace-normal max-w-xs">
                        <p className="text-xs font-semibold text-foreground">{lo.text}</p>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center border-r border-border">
                        <p className="text-xs font-mono font-bold text-foreground">{max}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">Pass: {pass}</p>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center border-r border-border bg-destructive/5">
                        <span className="px-2 py-1 rounded font-bold font-mono text-sm bg-destructive/10 text-destructive">{originalMark}</span>
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center border-r border-border bg-emerald-50/30 dark:bg-emerald-950/5">
                        <Input
                          type="date"
                          value={m?.reExamDate ?? ""}
                          onChange={e => handleReExamDate(lo.name, e.target.value)}
                          className="w-32 text-center border-emerald-300 dark:border-emerald-800/60 bg-transparent text-foreground h-9"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-center border-r border-border bg-emerald-50/30 dark:bg-emerald-950/5">
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          step="any"
                          value={m?.reExamMark ?? ""}
                          placeholder="—"
                          onChange={e => handleReExamMark(lo.name, e.target.value, max)}
                          className={cn(
                            "w-16 text-center text-sm font-bold h-9",
                            isPassing && reExamMark !== null && reExamMark !== undefined
                              ? "bg-emerald-100 dark:bg-emerald-950/45 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300"
                              : "bg-transparent border-input text-foreground",
                          )}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-normal">
                        <Input
                          type="text"
                          value={m?.remarks ?? ""}
                          placeholder="Add remarks..."
                          onChange={e => handleRemarks(lo.name, e.target.value)}
                          className="w-full h-9 bg-transparent placeholder:text-muted-foreground/60"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-5 flex flex-wrap items-center gap-8 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Obtained</p>
          <p className="text-2xl font-bold text-foreground">{obtained} <span className="text-base text-muted-foreground">/ {fullTotal}</span></p>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Final Result</p>
          <span className={cn(
            "px-3 py-1 rounded-full text-sm font-bold uppercase border",
            status === "Pass" ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40"
              : status === "Fail" ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted text-muted-foreground border-border",
          )}>{status}</span>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Failed Outcomes</p>
          <p className="text-xl font-bold text-destructive">{failedOutcomes.length}</p>
        </div>
      </div>
    </motion.div>
  );
}
