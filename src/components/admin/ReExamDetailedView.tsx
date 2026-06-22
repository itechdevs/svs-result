"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useStudentEvaluationResults } from "@/hooks/use-evaluations";
import { useReExamAssessment } from "@/hooks/use-re-exams";
import {
  calcObtainedMarks,
  calcFullMarks,
  calcPassFail,
} from "@/components/teacher/DetailedMarkEntryView";
import {
  Student,
  EvaluationPlan,
  StudentOutcomeMark,
  OutcomeMark,
} from "@/types/academic";
import { Input } from "@/components/shared/ui/input";
import SanskarLoader from "@/components/shared/SanskarLoader";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/shared/ui/table";

interface Props {
  student: Student;
  evaluation: EvaluationPlan;
}

export default function ReExamDetailedView({ student, evaluation }: Props) {
  const { data: resultsData = [], isLoading } = useStudentEvaluationResults({
    syncedStudentId: student.id,
    evaluationTemplateId: evaluation.id,
  });
  const reExamAssessment = useReExamAssessment();
  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark | undefined>(
    undefined,
  );
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const localMarksRef = useRef<StudentOutcomeMark | undefined>(undefined);

  // Keep ref in sync with state so auto-save timer always reads latest marks
  localMarksRef.current = localMarks;

  // Sync DB results into local state once
  useEffect(() => {
    if (resultsData.length === 0) return;
    const outcomeMarks: Record<string, OutcomeMark> = {};
    resultsData.forEach((r) => {
      const name =
        r.evaluationTemplate?.name ??
        evaluation.learningOutcomes[0]?.name ??
        "Mark";
      outcomeMarks[name] = {
        regularMark: r.marksObtained,
        regularDate: r.submittedAt
          ? new Date(r.submittedAt).toISOString().split("T")[0]
          : "",
        supportMark: null,
        supportDate: "",
        reExamMark: r.reExamResult?.marksObtained ?? null,
        reExamDate: r.reExamResult?.createdAt
          ? new Date(r.reExamResult.createdAt).toISOString().split("T")[0]
          : "",
        remarks: r.reExamResult?.remarks ?? r.remarks ?? "",
      };
    });
    setLocalMarks({
      studentId: student.id,
      evaluationId: evaluation.id,
      outcomeMarks,
    });
  }, [resultsData, student.id, evaluation.id, evaluation.learningOutcomes]);

  const updateMark = useCallback(
    (outcomeName: string, patch: Partial<OutcomeMark>) => {
      setLocalMarks((prev) => {
        const existing = prev?.outcomeMarks[outcomeName] ?? {
          regularMark: null,
          regularDate: "",
          supportMark: null,
          supportDate: "",
          reExamMark: null,
          reExamDate: "",
          remarks: "",
        };
        return {
          studentId: student.id,
          evaluationId: evaluation.id,
          outcomeMarks: {
            ...(prev?.outcomeMarks ?? {}),
            [outcomeName]: { ...existing, ...patch },
          },
        };
      });
    },
    [student.id, evaluation.id],
  );

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(() => {
      // Read latest marks from ref (avoids stale closure)
      const marks = localMarksRef.current;
      if (marks) {
        const outcomes = evaluation.learningOutcomes;
        const firstFailedOutcome = outcomes.find((lo) => {
          const m = marks.outcomeMarks[lo.name];
          return m?.reExamMark !== null && m?.reExamMark !== undefined;
        });

        if (firstFailedOutcome) {
          const m = marks.outcomeMarks[firstFailedOutcome.name];
          if (m?.reExamMark !== null && m?.reExamMark !== undefined) {
            reExamAssessment.mutate(
              {
                evaluationTemplateId: evaluation.id,
                syncedStudentId: student.id,
                marksObtained: m.reExamMark,
                scheduledDate: m.reExamDate || new Date().toISOString(),
                remarks: m.remarks,
              },
              {
                onSuccess: () => {
                  setAutoSaveStatus("saved");
                  setTimeout(() => setAutoSaveStatus("idle"), 2000);
                },
                onError: () => {
                  setAutoSaveStatus("error");
                  setTimeout(() => setAutoSaveStatus("idle"), 3000);
                },
              },
            );
          }
        }
      }
    }, 1000);
  }, [evaluation, student.id, reExamAssessment]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    },
    [],
  );

  const handleReExamMark = (
    outcomeName: string,
    value: string,
    max: number,
  ) => {
    const num = value === "" ? null : Math.min(Math.max(0, Number(value)), max);
    updateMark(outcomeName, { reExamMark: num });
    triggerAutoSave();
  };
  const handleReExamDate = (outcomeName: string, value: string) => {
    updateMark(outcomeName, { reExamDate: value });
    triggerAutoSave();
  };
  const handleRemarks = (outcomeName: string, value: string) => {
    updateMark(outcomeName, { remarks: value });
    triggerAutoSave();
  };

  const outcomes = evaluation.learningOutcomes;
  const obtained = outcomes.reduce((sum, lo) => {
    const m = localMarks?.outcomeMarks[lo.name];
    const finalMark = m?.reExamMark ?? m?.regularMark ?? 0;
    return sum + finalMark;
  }, 0);

  const fullTotal = calcFullMarks(outcomes);
  const status = (() => {
    const anyEntered = outcomes.some((lo) => {
      const m = localMarks?.outcomeMarks[lo.name];
      return m?.regularMark !== null && m?.regularMark !== undefined;
    });
    if (!anyEntered) return "Pending";
    const anyFail = outcomes.some((lo) => {
      const m = localMarks?.outcomeMarks[lo.name];
      const finalMark = m?.reExamMark ?? m?.regularMark;
      if (finalMark === null || finalMark === undefined) return false;
      return finalMark < (lo.passMarks ?? 0);
    });
    if (anyFail) return "Fail";
    const allEntered = outcomes.every((lo) => {
      const m = localMarks?.outcomeMarks[lo.name];
      return m?.regularMark !== null && m?.regularMark !== undefined;
    });
    if (!allEntered) return "Pending";
    return "Pass";
  })();

  const failedOutcomes = outcomes.filter((lo) => {
    const m = localMarks?.outcomeMarks[lo.name];
    return (
      m?.regularMark !== null &&
      m?.regularMark !== undefined &&
      m.regularMark < (lo.passMarks ?? 0)
    );
  });

  if (isLoading) {
    return <SanskarLoader message="Loading re-exam details..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-card text-card-foreground p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/re-exam-portal"
            className="p-1.5 hover:bg-muted rounded-full transition-colors border border-border"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h2 className="font-bold text-sm text-foreground">
              {student.name} - Re-Exam Entry
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {student.rollNo} · {evaluation.subject} · {evaluation.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase border",
              status === "Pass"
                ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border-emerald-250 dark:border-emerald-900/40"
                : status === "Fail"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-muted text-muted-foreground border-border",
            )}
          >
            {status}
          </span>
          <span className="font-bold text-sm text-foreground">
            {obtained} / {fullTotal}
          </span>
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Saving...
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved
            </span>
          )}
          {autoSaveStatus === "error" && (
            <span className="text-xs text-destructive flex items-center gap-1">
              ✗ Save failed
            </span>
          )}
        </div>
      </div>

      {/* Re-Exam Entry Table */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-destructive/5 to-orange-500/5 dark:from-destructive/10 dark:to-orange-500/10">
          <h3 className="text-sm font-bold text-foreground">
            Failed Outcomes - Re-Exam Assessment
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Only showing outcomes where the student failed. Pass marks remain
            unchanged.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-muted/50 to-muted/80 hover:bg-muted/60">
              <TableHead className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border h-auto">
                Learning Outcome
              </TableHead>
              <TableHead className="px-3 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center border-r border-border h-auto">
                Full / Pass
              </TableHead>
              <TableHead className="px-3 py-3 text-[10px] font-bold text-destructive uppercase tracking-wider text-center border-r border-border bg-destructive/5 h-auto">
                Original Mark
              </TableHead>
              <TableHead
                className="px-4 py-3 text-[10px] font-bold text-emerald-750 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-border bg-emerald-50/30 dark:bg-emerald-950/10 h-auto"
                colSpan={2}
              >
                Re-Exam Assessment
              </TableHead>
              <TableHead className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider h-auto">
                Remarks
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40 text-[9px] font-semibold text-muted-foreground uppercase hover:bg-muted/50">
              <TableHead className="px-4 py-2 border-r border-border h-8"></TableHead>
              <TableHead className="px-3 py-2 text-center border-r border-border h-8"></TableHead>
              <TableHead className="px-3 py-2 text-center border-r border-border h-8 bg-destructive/5"></TableHead>
              <TableHead className="px-3 py-2 text-center border-r border-border bg-emerald-50/40 dark:bg-emerald-950/10 h-8">
                <Calendar className="w-3 h-3 inline mr-1" />
                Date
              </TableHead>
              <TableHead className="px-3 py-2 text-center border-r border-border bg-emerald-50/40 dark:bg-emerald-950/10 h-8">
                Marks
              </TableHead>
              <TableHead className="px-4 py-2 h-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {failedOutcomes.map((lo) => {
              const m = localMarks?.outcomeMarks[lo.name];
              const max = lo.fullMarks ?? 100;
              const pass = lo.passMarks ?? 0;
              const originalMark = m?.regularMark ?? 0;
              const reExamMark = m?.reExamMark;
              const finalMark = reExamMark ?? originalMark;
              const isPassing = finalMark >= pass;
              return (
                <TableRow key={lo.name} className="hover:bg-muted/20">
                  <TableCell className="px-4 py-4 border-r border-border whitespace-normal max-w-xs">
                    <p className="text-xs font-semibold text-foreground">
                      {lo.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {lo.text}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-4 text-center border-r border-border">
                    <p className="text-xs font-mono font-bold text-foreground">
                      {max}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Pass: {pass}
                    </p>
                  </TableCell>
                  <TableCell className="px-3 py-4 text-center border-r border-border bg-destructive/5">
                    <span className="px-2 py-1 rounded font-bold font-mono text-sm bg-destructive/10 text-destructive">
                      {originalMark}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-4 text-center border-r border-border bg-emerald-50/30 dark:bg-emerald-950/5">
                    <Input
                      type="date"
                      value={m?.reExamDate ?? ""}
                      onChange={(e) =>
                        handleReExamDate(lo.name, e.target.value)
                      }
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
                      onChange={(e) =>
                        handleReExamMark(lo.name, e.target.value, max)
                      }
                      className={cn(
                        "w-16 text-center text-sm font-bold h-9",
                        isPassing &&
                          reExamMark !== null &&
                          reExamMark !== undefined
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
                      onChange={(e) => handleRemarks(lo.name, e.target.value)}
                      className="w-full h-9 bg-transparent placeholder:text-muted-foreground/60"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <div className="bg-card text-card-foreground rounded-xl border border-border p-5 flex flex-wrap items-center gap-8 shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Total Obtained
          </p>
          <p className="text-2xl font-bold text-foreground">
            {obtained}{" "}
            <span className="text-base text-muted-foreground">
              / {fullTotal}
            </span>
          </p>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Final Result
          </p>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-bold uppercase border",
              status === "Pass"
                ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border-emerald-250 dark:border-emerald-900/40"
                : status === "Fail"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-muted text-muted-foreground border-border",
            )}
          >
            {status}
          </span>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Failed Outcomes
          </p>
          <p className="text-xl font-bold text-destructive">
            {failedOutcomes.length}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
