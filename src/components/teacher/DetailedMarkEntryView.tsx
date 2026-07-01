'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { formatToBSFullString } from '@/lib/bs-calendar';
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
import { BSCalendarSelector } from '@/components/shared/ui/bs-calendar-selector';


// ── Pure calculation helpers (exported for reuse) ─────────────────────────────

export function calcObtainedMarks(
  studentId: string,
  outcomes: { name: string; templateId?: string }[],
  getStudentMark: (studentId: string, evalId: string) => StudentOutcomeMark | undefined
): number {
  return outcomes.reduce((sum, lo) => {
    if (!lo.templateId) return sum;
    const mark = getStudentMark(studentId, lo.templateId);
    const m = mark?.outcomeMarks[lo.name];
    // Final mark = MAX(regularMark, reExamMark)
    const finalMark =
      m?.reExamMark !== null && m?.reExamMark !== undefined
        ? Math.max(m.reExamMark, m?.regularMark ?? 0)
        : m?.regularMark;
    return sum + (finalMark ?? 0);
  }, 0);
}

export function calcFullMarks(outcomes: { fullMarks?: number }[]): number {
  return outcomes.reduce((sum, lo) => sum + (lo.fullMarks ?? 0), 0);
}

export function calcPassFail(
  studentId: string,
  outcomes: { name: string; passMarks?: number; templateId?: string }[],
  getStudentMark: (studentId: string, evalId: string) => StudentOutcomeMark | undefined
): 'Pass' | 'Fail' | 'Pending' {
  const allEntered = outcomes.every((lo) => {
    if (!lo.templateId) return false;
    const mark = getStudentMark(studentId, lo.templateId);
    const m = mark?.outcomeMarks[lo.name];
    return m?.regularMark !== null && m?.regularMark !== undefined;
  });
  const anyEntered = outcomes.some((lo) => {
    if (!lo.templateId) return false;
    const mark = getStudentMark(studentId, lo.templateId);
    const m = mark?.outcomeMarks[lo.name];
    return m?.regularMark !== null && m?.regularMark !== undefined;
  });
  if (!anyEntered) return 'Pending';

  const anyFail = outcomes.some((lo) => {
    if (!lo.templateId) return false;
    const mark = getStudentMark(studentId, lo.templateId);
    const m = mark?.outcomeMarks[lo.name];
    // Final mark = MAX(regularMark, reExamMark)
    const finalMark =
      m?.reExamMark !== null && m?.reExamMark !== undefined
        ? Math.max(m.reExamMark, m?.regularMark ?? 0)
        : m?.regularMark;
    if (finalMark === null || finalMark === undefined) return false;
    return finalMark < (lo.passMarks ?? 0);
  });

  if (anyFail) return 'Fail';
  if (!allEntered) return 'Pending';
  return 'Pass';
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
  handleSaveAll: () => Promise<void>;
  readOnly?: boolean;
}

export default function DetailedMarkEntryView({ student, evaluation, getStudentMark, updateOutcomeMark, handleSaveAll, readOnly = false }: Props) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const marks = getStudentMark(student.id, evaluation.id);
  const outcomes = evaluation.learningOutcomes;

  // Group outcomes by taskType for row-spanning
  const grouped = outcomes.reduce<Record<string, typeof outcomes>>((acc, lo) => {
    const key = lo.taskType ?? 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(lo);
    return acc;
  }, {});

  const handleRegular = (outcomeName: string, templateId: string, field: 'regularMark' | 'regularDate', value: string, max: number) => {
    if (field === 'regularMark') {
      const num = value === '' ? null : Math.min(Math.max(0, Number(value)), max);
      updateOutcomeMark(student.id, templateId, outcomeName, { regularMark: num });
    } else {
      updateOutcomeMark(student.id, templateId, outcomeName, { regularDate: value });
    }
  };

  const handleReExamDate = (outcomeName: string, templateId: string, value: string) => {
    updateOutcomeMark(student.id, templateId, outcomeName, { reExamDate: value });
  };

  const handleRemarks = (outcomeName: string, templateId: string, value: string) => {
    updateOutcomeMark(student.id, templateId, outcomeName, { remarks: value });
  };

  // For display: use effective mark (re-exam > regular)
  const obtained = outcomes.reduce((sum, lo) => {
    if (!lo.templateId) return sum;
    const mark = getStudentMark(student.id, lo.templateId);
    const m = mark?.outcomeMarks[lo.name];
    const finalMark =
      m?.reExamMark !== null && m?.reExamMark !== undefined
        ? Math.max(m.reExamMark, m?.regularMark ?? 0)
        : m?.regularMark ?? 0;
    return sum + finalMark;
  }, 0);
  const fullTotal = calcFullMarks(outcomes);
  const status = calcPassFail(student.id, outcomes, getStudentMark);

  const isPending = status === 'Pending';
  const isPass = status === 'Pass';

  const statusStyles = {
    Pass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
    Pending: 'bg-muted text-muted-foreground',
    Fail: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">

      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <div className="sticky top-4 z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/95 backdrop-blur-sm p-4 rounded-xl border border-border shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-foreground truncate">{student.name}</h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {student.rollNo} · {evaluation.subject} · {evaluation.title}
              {evaluation.date && evaluation.date !== 'TBD' && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                  <Calendar className="w-3 h-3" />
                  {formatToBSFullString(evaluation.date)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-bold uppercase',
            statusStyles[status]
          )}>
            {status}
          </span>
          <span className="font-bold text-sm text-foreground">{obtained} / {fullTotal}</span>
          {!readOnly && (
            <button
              onClick={async () => {
                setSaveStatus('saving');
                try {
                  await handleSaveAll();
                  setSaveStatus('saved');
                  setTimeout(() => setSaveStatus('idle'), 2500);
                } catch {
                  setSaveStatus('idle');
                }
              }}
              disabled={saveStatus === 'saving'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border',
                saveStatus === 'saved'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : saveStatus === 'saving'
                    ? 'opacity-60 cursor-not-allowed bg-muted text-muted-foreground border-border'
                    : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
              )}
            >
              {saveStatus === 'saved' ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
              ) : saveStatus === 'saving' ? (
                <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving...</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save</>
              )}
            </button>
          )}
        </div>
      </div>



      {/* ── Marks Table ─────────────────────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-10 text-center">SN</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-36">Task Type</TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">Sub Learning Outcome Criteria</TableHead>
              <TableHead className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-border bg-emerald-500/5" colSpan={2}>
                Regular Class Assessment
              </TableHead>
              <TableHead className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-center border-r border-border bg-orange-500/5" colSpan={2}>
                Re-Exam Assessment
              </TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remarks</TableHead>
            </TableRow>
            <TableRow className="bg-muted/40 border-t border-border text-[9px] font-semibold text-muted-foreground uppercase">
              <TableHead className="border-r border-border" />
              <TableHead className="border-r border-border" />
              <TableHead className="border-r border-border" />
              <TableHead className="text-center border-r border-border">Date</TableHead>
              <TableHead className="text-center border-r border-border">Marks</TableHead>
              <TableHead className="text-center border-r border-border bg-orange-50/30 dark:bg-orange-950/10">Date</TableHead>
              <TableHead className="text-center border-r border-border bg-orange-50/30 dark:bg-orange-950/10">Marks</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(grouped).map(([taskType, los], groupIdx) =>
              los.map((lo, idx) => {
                const markObj = lo.templateId ? getStudentMark(student.id, lo.templateId) : undefined;
                const m = markObj?.outcomeMarks[lo.name];
                const max = lo.fullMarks ?? 100;
                const pass = lo.passMarks ?? 0;
                // Final mark = MAX(regularMark, reExamMark)
                const effectiveMark =
                  m?.reExamMark !== null && m?.reExamMark !== undefined
                    ? Math.max(m.reExamMark, m?.regularMark ?? 0)
                    : m?.regularMark ?? null;
                const regFail =
                  m?.regularMark !== null &&
                  m?.regularMark !== undefined &&
                  m.regularMark < pass;
                // Outcome fails based on effective mark
                const effectiveFail =
                  effectiveMark !== null &&
                  effectiveMark !== undefined &&
                  effectiveMark < pass;
                const hasReExam =
                  (m?.reExamMark !== null && m?.reExamMark !== undefined) || !!m?.reExamDate;
                const rowSn = groupIdx + 1;

                return (
                  <TableRow
                    key={lo.name}
                    className={cn(
                      'hover:bg-muted/20 transition-colors',
                      effectiveFail && 'bg-red-50/30 dark:bg-red-950/10'
                    )}
                  >
                    {idx === 0 && (
                      <>
                        <TableCell
                          rowSpan={los.length}
                          className="text-center font-mono text-xs font-semibold text-muted-foreground border-r border-b border-border bg-slate-50 dark:bg-slate-900/50 align-top pt-4 shadow-inner"
                        >
                          {rowSn}
                        </TableCell>
                        <TableCell
                          rowSpan={los.length}
                          className="text-sm font-extrabold text-[#002045] dark:text-blue-300 border-r border-b border-border bg-slate-50 dark:bg-slate-900/50 align-top pt-4 shadow-inner"
                        >
                          {taskType}
                        </TableCell>
                      </>
                    )}

                    {/* Sub-outcome label */}
                    <TableCell className="border-r border-border whitespace-normal max-w-xs">
                      <div className="flex items-start gap-2">
                        {effectiveFail && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-foreground">{lo.text}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                            Full: {max} · Pass: {pass}
                          </p>
                          {regFail && !hasReExam && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40 px-1.5 py-0.5 rounded-full mt-1">
                              Failed
                            </span>
                          )}
                          {hasReExam && (
                            <span className={cn(
                              'inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1',
                              effectiveFail
                                ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/40'
                                : 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40'
                            )}>
                              Re-Exam{effectiveFail ? ' Failed' : ' Passed'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Regular: Date */}
                    <TableCell className="text-center border-r border-border">
                      <BSCalendarSelector
                        value={m?.regularDate || lo.regularDate || ''}
                        onChange={(val) => handleRegular(lo.name, lo.templateId!, 'regularDate', val, max)}
                        disabled={readOnly}
                        className="w-32 text-center mx-auto text-xs"
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
                        readOnly={readOnly}
                        tabIndex={readOnly ? -1 : undefined}
                        onChange={readOnly ? undefined : (e) => handleRegular(lo.name, lo.templateId!, 'regularMark', e.target.value, max)}
                        className={cn(
                          'w-16 text-center text-sm font-bold mx-auto border-2',
                          readOnly && 'cursor-default opacity-80',
                          regFail
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300'
                            : m?.regularMark !== null && m?.regularMark !== undefined
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                              : 'border-muted-foreground/20'
                        )}
                      />
                    </TableCell>

                    {/* Re-Exam: Date */}
                    <TableCell className="text-center border-r border-border bg-orange-50/20 dark:bg-orange-950/5">
                      {hasReExam ? (
                        <BSCalendarSelector
                          value={m?.reExamDate ?? ''}
                          onChange={(val) => handleReExamDate(lo.name, lo.templateId!, val)}
                          disabled={readOnly}
                          className="w-32 text-center mx-auto text-xs"
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">—</span>
                      )}
                    </TableCell>

                    {/* Re-Exam: Marks (read-only badge) */}
                    <TableCell className="text-center border-r border-border bg-orange-50/20 dark:bg-orange-950/5">
                      {hasReExam ? (
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          step="any"
                          value={m?.reExamMark ?? ''}
                          placeholder="—"
                          readOnly={readOnly}
                          tabIndex={readOnly ? -1 : undefined}
                          onChange={readOnly ? undefined : (e) => {
                            const num = e.target.value === '' ? null : Math.min(Math.max(0, Number(e.target.value)), max);
                            updateOutcomeMark(student.id, lo.templateId!, lo.name, { reExamMark: num });
                          }}
                          className={cn(
                            'w-16 text-center text-sm font-bold mx-auto border-2',
                            readOnly && 'cursor-default opacity-80',
                            !effectiveFail
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950/40 border-red-400 dark:border-red-700 text-red-900 dark:text-red-300'
                          )}
                        />
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">—</span>
                      )}
                    </TableCell>

                    {/* Remarks */}
                    <TableCell>
                      {readOnly ? (
                        <span className="text-xs text-muted-foreground">{m?.remarks || '—'}</span>
                      ) : (
                        <Input
                          type="text"
                          value={m?.remarks ?? ''}
                          placeholder="Add remarks..."
                          onChange={(e) => handleRemarks(lo.name, lo.templateId!, e.target.value)}
                          className="w-full text-xs min-w-[140px]"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Footer Summary ───────────────────────────────────────────────────── */}
      <div className="bg-muted/30 rounded-xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:divide-x sm:divide-border">
        <div className="flex justify-between items-center sm:block sm:pr-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:mb-1">Total</p>
          <p className="text-lg sm:text-2xl font-bold text-foreground">
            {obtained} <span className="text-sm sm:text-base text-muted-foreground">/ {fullTotal}</span>
          </p>
        </div>
        <div className="flex justify-between items-center sm:block sm:px-8 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:mb-1">Percentage</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {fullTotal > 0 ? ((obtained / fullTotal) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="flex justify-between items-center sm:block sm:px-8 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:mb-1">Result</p>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-bold',
            statusStyles[status]
          )}>
            {status === 'Fail' && <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {isPass && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {status}
          </span>
        </div>
        {evaluation.date && evaluation.date !== 'TBD' && (
          <div className="flex justify-between items-center sm:block sm:pl-8 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider sm:mb-1">Date</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              {formatToBSFullString(evaluation.date)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
