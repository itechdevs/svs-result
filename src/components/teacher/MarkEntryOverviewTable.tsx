'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAcademicContext, calcObtainedMarks, calcFullMarks, calcPassFail } from '@/contexts/AcademicContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { useSearchParams } from 'next/navigation';

export default function MarkEntryOverviewTable() {
  const {
    assignedClasses,
    subjectsForClass,
    evaluationForClassSubject,
    studentsForClass,
    evaluations,
    getStudentMark,
    updateOutcomeMark,
  } = useAcademicContext();

  const searchParams = useSearchParams();
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') ?? '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') ?? '');
  const [saved, setSaved] = useState(false);

  const subjects = useMemo(
    () => (selectedClass ? subjectsForClass(selectedClass) : []),
    [selectedClass, subjectsForClass]
  );

  const evaluationId = useMemo(
    () => (selectedClass && selectedSubject ? evaluationForClassSubject(selectedClass, selectedSubject) : undefined),
    [selectedClass, selectedSubject, evaluationForClassSubject]
  );

  const evaluation = useMemo(
    () => evaluations.find(e => e.id === evaluationId),
    [evaluations, evaluationId]
  );

  const classStudents = useMemo(
    () => (selectedClass ? studentsForClass(selectedClass) : []),
    [selectedClass, studentsForClass]
  );

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubject('');
  };

  const handleMarkChange = (studentId: string, outcomeName: string, raw: string, max: number) => {
    if (!evaluationId) return;
    const num = raw === '' ? null : Math.min(Math.max(0, Number(raw)), max);
    updateOutcomeMark(studentId, evaluationId, outcomeName, { regularMark: num });
  };

  const outcomes = evaluation?.learningOutcomes ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Filters */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
        <h1 className="text-lg font-bold text-[#002045] dark:text-white mb-4">Mark Entry</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Class</label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder={selectedClass ? 'Select a subject...' : 'Select a class first'} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Prompt */}
      {(!selectedClass || !selectedSubject) && (
        <div className="bg-white dark:bg-card rounded-xl border border-dashed border-slate-300 dark:border-border p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a class and subject to view the mark entry table.</p>
        </div>
      )}

      {/* No evaluation */}
      {selectedClass && selectedSubject && !evaluation && (
        <div className="bg-white dark:bg-card rounded-xl border border-dashed border-slate-300 dark:border-border p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No evaluation plan found for <strong>{selectedSubject}</strong> in <strong>{selectedClass}</strong>.
          </p>
        </div>
      )}

      {/* Table */}
      {evaluation && (
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-border">
            <div>
              <p className="font-bold text-sm text-[#002045] dark:text-white">{evaluation.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedClass} · {selectedSubject} · {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Save All
            </button>
          </div>

          {classStudents.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No students found in {selectedClass}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-border">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Student ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                    {outcomes.map(lo => (
                      <th key={lo.name} className="px-2 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">
                        <div>{lo.name}</div>
                        <div className="text-[9px] font-normal text-slate-400 normal-case">/{lo.fullMarks ?? '—'} · pass {lo.passMarks ?? '—'}</div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Total</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Achieved</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Detailed View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border">
                  {classStudents.map(student => {
                    const marks = getStudentMark(student.id, evaluation.id);
                    const obtained = calcObtainedMarks(marks, outcomes);
                    const fullTotal = calcFullMarks(outcomes);
                    const status = calcPassFail(marks, outcomes);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{student.rollNo}</td>
                        <td className="px-4 py-3 font-medium text-[#002045] dark:text-white whitespace-nowrap">{student.name}</td>

                        {outcomes.map(lo => {
                          const val = marks?.outcomeMarks[lo.name]?.regularMark;
                          const max = lo.fullMarks ?? 100;
                          const isFail = val !== null && val !== undefined && val < (lo.passMarks ?? 0);
                          return (
                            <td key={lo.name} className="px-2 py-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={max}
                                step="any"
                                value={val ?? ''}
                                placeholder="—"
                                onChange={e => handleMarkChange(student.id, lo.name, e.target.value, max)}
                                className={cn(
                                  'w-16 px-2 py-1.5 text-center text-xs font-bold rounded border-2 focus:outline-none focus:ring-2',
                                  isFail
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300 focus:ring-red-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 focus:ring-emerald-400'
                                )}
                              />
                            </td>
                          );
                        })}

                        <td className="px-4 py-3 text-center font-bold text-sm text-[#002045] dark:text-white whitespace-nowrap">
                          {obtained} / {fullTotal}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase',
                            status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                              : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          )}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/teacher/mark-entry/${student.id}?evalId=${evaluation.id}`}
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

      {/* Save toast */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50"
        >
          <CheckCircle className="w-5 h-5" />
          Marks saved successfully!
        </motion.div>
      )}
    </motion.div>
  );
}
