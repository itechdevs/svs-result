'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAcademicContext, calcObtainedMarks, calcFullMarks, calcPassFail } from '@/contexts/AcademicContext';
import { Student, EvaluationPlan } from '@/types/academic';

interface Props {
  student: Student;
  evaluation: EvaluationPlan;
}

export default function DetailedMarkEntryView({ student, evaluation }: Props) {
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
      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-border shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/mark-entry"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-border"
          >
            <ArrowLeft className="w-4 h-4 text-[#002045] dark:text-blue-300" />
          </Link>
          <div>
            <h2 className="font-bold text-sm text-[#002045] dark:text-white">{student.name}</h2>
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

      {/* Table */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
                <th className="px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border w-10 text-center">SN</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border w-36">Task Type</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border">Sub Learning Outcome Criteria</th>
                <th className="px-4 py-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-emerald-50 dark:bg-emerald-950/20" colSpan={2}>
                  Regular Class Assessment
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-purple-50 dark:bg-purple-950/20" colSpan={2}>
                  Assessment After Support
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Remarks</th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-border text-[9px] font-semibold text-slate-500 uppercase">
                <th className="px-3 py-2 border-r border-slate-200 dark:border-border"></th>
                <th className="px-4 py-2 border-r border-slate-200 dark:border-border"></th>
                <th className="px-4 py-2 border-r border-slate-200 dark:border-border"></th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border">Date</th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border">Marks</th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border">Date</th>
                <th className="px-3 py-2 text-center border-r border-slate-200 dark:border-border">Marks</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border">
              {Object.entries(grouped).map(([taskType, los]) =>
                los.map((lo, idx) => {
                  sn++;
                  const m = marks?.outcomeMarks[lo.name];
                  const max = lo.fullMarks ?? 100;
                  const pass = lo.passMarks ?? 0;
                  const regFail = m?.regularMark !== null && m?.regularMark !== undefined && m.regularMark < pass;
                  const isFailed = regFail; // eligible for support assessment
                  const rowSn = sn;

                  return (
                    <tr key={lo.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-3 py-4 text-center font-mono text-xs font-semibold text-slate-500 border-r border-slate-200 dark:border-border">{rowSn}</td>
                      <td className="px-4 py-4 text-xs font-bold text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-border">
                        {idx === 0 ? taskType : <span className="text-slate-400 font-normal">↳</span>}
                      </td>
                      <td className="px-4 py-4 border-r border-slate-200 dark:border-border">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{lo.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{lo.text}</p>
                        <p className="text-[9px] text-slate-400 mt-1">Full: {max} · Pass: {pass}</p>
                      </td>

                      {/* Regular: Date */}
                      <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                        <input
                          type="date"
                          value={m?.regularDate ?? ''}
                          onChange={e => handleRegular(lo.name, 'regularDate', e.target.value, max)}
                          className="w-28 px-2 py-1.5 text-xs text-center border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        />
                      </td>

                      {/* Regular: Marks */}
                      <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                        <input
                          type="number"
                          min={0}
                          max={max}
                          step="any"
                          value={m?.regularMark ?? ''}
                          placeholder="—"
                          onChange={e => handleRegular(lo.name, 'regularMark', e.target.value, max)}
                          className={cn(
                            'w-16 px-2 py-1.5 text-center text-sm font-bold rounded border-2 focus:outline-none focus:ring-2',
                            regFail
                              ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300 focus:ring-red-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 focus:ring-emerald-400'
                          )}
                        />
                      </td>

                      {/* Support: Date */}
                      <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                        {isFailed ? (
                          <input
                            type="date"
                            value={m?.supportDate ?? ''}
                            onChange={e => handleSupport(lo.name, 'supportDate', e.target.value, max)}
                            className="w-28 px-2 py-1.5 text-xs text-center border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Support: Marks */}
                      <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                        {isFailed ? (
                          <input
                            type="number"
                            min={0}
                            max={max}
                            step="any"
                            value={m?.supportMark ?? ''}
                            placeholder="—"
                            onChange={e => handleSupport(lo.name, 'supportMark', e.target.value, max)}
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded border-2 bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                        )}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer summary */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-border p-5 flex flex-wrap items-center gap-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Obtained</p>
          <p className="text-2xl font-bold text-[#002045] dark:text-blue-300">
            {obtained} <span className="text-base text-slate-400">/ {fullTotal}</span>
          </p>
        </div>
        <div className="border-l border-slate-200 dark:border-border pl-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Result</p>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-bold uppercase',
            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          )}>
            {status}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
