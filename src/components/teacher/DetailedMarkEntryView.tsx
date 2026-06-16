'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Student, EvaluationPlan, StudentOutcomeMark, OutcomeMark } from '@/types/academic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Pure calculation helpers (exported for reuse) ─────────────────────────────

export function calcObtainedMarks(
  studentMarks: StudentOutcomeMark | undefined,
  outcomes: { name: string }[]
): number {
  if (!studentMarks) return 0;
  return outcomes.reduce((sum, lo) => {
    const m = studentMarks.outcomeMarks[lo.name];
    return sum + (m?.regularMark ?? 0);
  }, 0);
}

export function calcFullMarks(outcomes: { fullMarks?: number }[]): number {
  return outcomes.reduce((sum, lo) => sum + (lo.fullMarks ?? 0), 0);
}

export function calcPassFail(
  studentMarks: StudentOutcomeMark | undefined,
  outcomes: { name: string; passMarks?: number }[]
): 'Pass' | 'Fail' | 'Pending' {
  if (!studentMarks) return 'Pending';
  const allEntered = outcomes.every(lo => {
    const m = studentMarks.outcomeMarks[lo.name];
    return m?.regularMark !== null && m?.regularMark !== undefined;
  });
  if (!allEntered) return 'Pending';
  const anyFail = outcomes.some(lo => {
    const m = studentMarks.outcomeMarks[lo.name];
    const finalMark = m?.reExamMark ?? m?.regularMark ?? 0;
    return finalMark < (lo.passMarks ?? 0);
  });
  return anyFail ? 'Fail' : 'Pass';
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  student: Student;
  evaluation: EvaluationPlan;
  getStudentMark: (studentId: string, evaluationId: string) => StudentOutcomeMark | undefined;
  updateOutcomeMark: (
    studentId: string,
    evaluationId: string,
    outcomeName: string,
    patch: Partial<OutcomeMark>
  ) => void;
}

export default function DetailedMarkEntryView({ student, evaluation, getStudentMark, updateOutcomeMark }: Props) {
  const router = useRouter();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const marks = getStudentMark(student.id, evaluation.id);
  const outcomes = evaluation.learningOutcomes;

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Group outcomes by taskType for the SN column
  const grouped = outcomes.reduce<Record<string, typeof outcomes>>((acc, lo) => {
    const key = lo.taskType ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(lo);
    return acc;
  }, {});

  const handleRegular = (outcomeName: string, field: 'regularMark' | 'regularDate', value: string, max: number) => {
    if (field === 'regularMark') {
      const num = value === '' ? null : Math.min(Math.max(0, Number(value)), max);
      updateOutcomeMark(student.id, evaluation.id, outcomeName, { regularMark: num });
    } else {
      updateOutcomeMark(student.id, evaluation.id, outcomeName, { regularDate: value });
    }
    triggerAutoSave();
  };

  const handleSupport = (outcomeName: string, field: 'supportMark' | 'supportDate', value: string, max: number) => {
    if (field === 'supportMark') {
      const num = value === '' ? null : Math.min(Math.max(0, Number(value)), max);
      updateOutcomeMark(student.id, evaluation.id, outcomeName, { supportMark: num });
    } else {
      updateOutcomeMark(student.id, evaluation.id, outcomeName, { supportDate: value });
    }
    triggerAutoSave();
  };

  const handleRemarks = (outcomeName: string, value: string) => {
    updateOutcomeMark(student.id, evaluation.id, outcomeName, { remarks: value });
    triggerAutoSave();
  };

  const obtained = calcObtainedMarks(marks, outcomes);
  const fullTotal = calcFullMarks(outcomes);
  const status = calcPassFail(marks, outcomes);

  let sn = 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="font-bold text-sm text-foreground">{student.name}</h2>
            <p className="text-[11px] text-muted-foreground">{student.rollNo} · {evaluation.subject} · {evaluation.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-bold uppercase',
            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                : 'bg-muted text-muted-foreground'
          )}>
            {status}
          </span>
          <span className="font-bold text-sm text-foreground">{obtained} / {fullTotal}</span>
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-10 text-center">SN</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-36">Task Type</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">Sub Learning Outcome Criteria</TableHead>
              <TableHead className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-border bg-emerald-500/5" colSpan={2}>
                Regular Class Assessment
              </TableHead>
              <TableHead className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-center border-r border-border bg-purple-500/5" colSpan={2}>
                Assessment After Support
              </TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remarks</TableHead>
            </TableRow>
            <TableRow className="bg-muted/40 border-t border-border text-[9px] font-semibold text-muted-foreground uppercase">
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="text-center border-r border-border">Date</TableHead>
              <TableHead className="text-center border-r border-border">Marks</TableHead>
              <TableHead className="text-center border-r border-border">Date</TableHead>
              <TableHead className="text-center border-r border-border">Marks</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([taskType, los], groupIdx) =>
              los.map((lo, idx) => {
                const m = marks?.outcomeMarks[lo.name];
                const max = lo.fullMarks ?? 100;
                const pass = lo.passMarks ?? 0;
                const regFail = m?.regularMark !== null && m?.regularMark !== undefined && m.regularMark < pass;
                const isFailed = regFail; // eligible for support assessment
                const rowSn = groupIdx + 1;

                return (
                  <TableRow key={lo.name} className="hover:bg-muted/20 transition-colors">
                    {idx === 0 && (
                      <>
                        <TableCell rowSpan={los.length} className="text-center font-mono text-xs font-semibold text-muted-foreground border-r border-b border-border bg-slate-50 dark:bg-slate-900/50 align-top pt-4 shadow-inner">
                          {rowSn}
                        </TableCell>
                        <TableCell rowSpan={los.length} className="text-sm font-extrabold text-[#002045] dark:text-blue-300 border-r border-b border-border bg-slate-50 dark:bg-slate-900/50 align-top pt-4 shadow-inner">
                          {taskType}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="border-r border-border whitespace-normal max-w-xs">
                      <p className="text-xs font-semibold text-foreground">{lo.text}</p>

                      <p className="text-[9px] text-muted-foreground mt-1 font-mono">Full: {max} · Pass: {pass}</p>
                    </TableCell>

                    {/* Regular: Date */}
                    <TableCell className="text-center border-r border-border">
                      <Input
                        type="date"
                        value={m?.regularDate ?? ''}
                        onChange={e => handleRegular(lo.name, 'regularDate', e.target.value, max)}
                        className="w-28 text-xs text-center mx-auto"
                      />
                    </TableCell>

                    {/* Regular: Marks */}
                    <TableCell className="text-center border-r border-border">
                      <Input
                        type="number"
                        min={0}
                        max={max}
                        step="any"
                        value={m?.regularMark ?? ''}
                        placeholder="—"
                        onChange={e => handleRegular(lo.name, 'regularMark', e.target.value, max)}
                        className={cn(
                          'w-16 text-center text-sm font-bold mx-auto border-2',
                          regFail
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                        )}
                      />
                    </TableCell>

                    {/* Support: Date */}
                    <TableCell className="text-center border-r border-border">
                      {isFailed ? (
                        <Input
                          type="date"
                          value={m?.supportDate ?? ''}
                          onChange={e => handleSupport(lo.name, 'supportDate', e.target.value, max)}
                          className="w-28 text-xs text-center mx-auto"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Support: Marks */}
                    <TableCell className="text-center border-r border-border">
                      {isFailed ? (
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          step="any"
                          value={m?.supportMark ?? ''}
                          placeholder="—"
                          onChange={e => handleSupport(lo.name, 'supportMark', e.target.value, max)}
                          className="w-16 text-center text-sm font-bold mx-auto border-2 bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </TableCell>

                    {/* Remarks */}
                    <TableCell>
                      <Input
                        type="text"
                        value={m?.remarks ?? ''}
                        placeholder="Add remarks..."
                        onChange={e => handleRemarks(lo.name, e.target.value)}
                        className="w-full text-xs"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer summary */}
      <div className="bg-muted/30 rounded-xl border border-border p-5 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Obtained</p>
          <p className="text-2xl font-bold text-foreground">
            {obtained} <span className="text-base text-muted-foreground">/ {fullTotal}</span>
          </p>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Percentage</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {fullTotal > 0 ? ((obtained / fullTotal) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="border-l border-border pl-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Result</p>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-bold uppercase',
            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                : 'bg-muted text-muted-foreground'
          )}>
            {status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
