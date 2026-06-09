'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAcademicContext, calcObtainedMarks, calcFullMarks, calcPassFail } from '@/contexts/AcademicContext';
import { Student, EvaluationPlan } from '@/types/academic';

interface Props {
  student: Student;
  evaluation: EvaluationPlan;
}

export default function ReExamDetailedView({ student, evaluation }: Props) {
  const { getStudentMark, updateOutcomeMark } = useAcademicContext();
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

  const handleReExamMark = (outcomeName: string, value: string, max: number) => {
    const num = value === '' ? null : Math.min(Math.max(0, Number(value)), max);
    updateOutcomeMark(student.id, evaluation.id, outcomeName, { reExamMark: num });
    triggerAutoSave();
  };

  const handleReExamDate = (outcomeName: string, value: string) => {
    updateOutcomeMark(student.id, evaluation.id, outcomeName, { reExamDate: value });
    triggerAutoSave();
  };

  const handleRemarks = (outcomeName: string, value: string) => {
    updateOutcomeMark(student.id, evaluation.id, outcomeName, { remarks: value });
    triggerAutoSave();
  };

  const obtained = calcObtainedMarks(marks, outcomes);
  const fullTotal = calcFullMarks(outcomes);
  const status = calcPassFail(marks, outcomes);

  const failedOutcomes = outcomes.filter(lo => {
    const m = marks?.outcomeMarks[lo.name];
    const regularMark = m?.regularMark ?? 0;
    return regularMark < (lo.passMarks ?? 0) && m?.regularMark !== null && m?.regularMark !== undefined;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/re-exam-portal"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-border"
          >
            <ArrowLeft className="w-4 h-4 text-[#002045] dark:text-blue-300" />
          </Link>
          <div>
            <h2 className="font-bold text-sm text-[#002045] dark:text-white">{student.name} - Re-Exam Entry</h2>
            <p className="text-[11px] text-slate-400">{student.rollNo} · {evaluation.subject} · {evaluation.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'px-3 py-1 rounded-full text-xs font-bold uppercase',
            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          )}>
            {status}
          </span>
          <span className="font-bold text-sm text-[#002045] dark:text-white">{obtained} / {fullTotal}</span>
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">Saving...</span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Re-Exam Entry Table */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-border bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <h3 className="text-sm font-bold text-[#002045] dark:text-white">Failed Outcomes - Re-Exam Assessment</h3>
          <p className="text-[10px] text-slate-500 mt-1">Only showing outcomes where the student failed. Pass marks remain unchanged.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border">Learning Outcome</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border">Full / Pass</th>
                <th className="px-3 py-3 text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-red-50 dark:bg-red-950/20">Original Mark</th>
                <th className="px-4 py-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-emerald-50 dark:bg-emerald-950/20" colSpan={2}>
                  Re-Exam Assessment
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Remarks</th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-border text-[9px] font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2 border-r border-slate-200 dark:border-border"></th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border"></th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border"></th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border bg-emerald-50 dark:bg-emerald-950/20">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Date
                </th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border bg-emerald-50 dark:bg-emerald-950/20">Marks</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border">
              {failedOutcomes.map((lo) => {
                const m = marks?.outcomeMarks[lo.name];
                const max = lo.fullMarks ?? 100;
                const pass = lo.passMarks ?? 0;
                const originalMark = m?.regularMark ?? 0;
                const reExamMark = m?.reExamMark;
                const finalMark = reExamMark ?? originalMark;
                const isPassing = finalMark >= pass;

                return (
                  <tr key={lo.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 border-r border-slate-200 dark:border-border">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lo.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{lo.text}</p>
                    </td>

                    <td className="px-3 py-4 text-center border-r border-slate-200 dark:border-border">
                      <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{max}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Pass: {pass}</p>
                    </td>

                    <td className="px-3 py-4 text-center border-r border-slate-200 dark:border-border bg-red-50/50 dark:bg-red-950/10">
                      <span className="px-2 py-1 rounded font-bold font-mono text-sm bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300">
                        {originalMark}
                      </span>
                    </td>

                    {/* Re-Exam Date */}
                    <td className="px-3 py-4 text-center border-r border-slate-200 dark:border-border bg-emerald-50/50 dark:bg-emerald-950/10">
                      <input
                        type="date"
                        value={m?.reExamDate ?? ''}
                        onChange={e => handleReExamDate(lo.name, e.target.value)}
                        className="w-32 px-2 py-1.5 text-xs text-center border border-emerald-300 dark:border-emerald-800 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-400"
                      />
                    </td>

                    {/* Re-Exam Mark */}
                    <td className="px-3 py-4 text-center border-r border-slate-200 dark:border-border bg-emerald-50/50 dark:bg-emerald-950/10">
                      <input
                        type="number"
                        min={0}
                        max={max}
                        step="any"
                        value={m?.reExamMark ?? ''}
                        placeholder="—"
                        onChange={e => handleReExamMark(lo.name, e.target.value, max)}
                        className={cn(
                          'w-16 px-2 py-1.5 text-center text-sm font-bold rounded border-2 focus:outline-none focus:ring-2',
                          isPassing && reExamMark !== null && reExamMark !== undefined
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 focus:ring-emerald-400'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-border text-slate-700 dark:text-slate-300 focus:ring-slate-400'
                        )}
                      />
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        value={m?.remarks ?? ''}
                        placeholder="Add remarks..."
                        onChange={e => handleRemarks(lo.name, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-border p-5 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Obtained</p>
          <p className="text-2xl font-bold text-[#002045] dark:text-blue-300">
            {obtained} <span className="text-base text-slate-400">/ {fullTotal}</span>
          </p>
        </div>
        <div className="border-l border-slate-200 dark:border-border pl-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Final Result</p>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-bold uppercase',
            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          )}>
            {status}
          </span>
        </div>
        <div className="border-l border-slate-200 dark:border-border pl-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Failed Outcomes</p>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{failedOutcomes.length}</p>
        </div>
      </div>
    </motion.div>
  );
}
