'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertCircle, Clock, CalendarCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAcademicContext } from '@/contexts/AcademicContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

export default function ReExamPortalTab() {
  const { getFailedStudents, getStudentMark, assignedClasses, subjectsForClass } = useAcademicContext();
  const allFailedStudents = getFailedStudents();

  const [selectedClass, setSelectedClass] = useState('_all');
  const [selectedSubject, setSelectedSubject] = useState('_all');

  const subjects = useMemo(
    () => selectedClass && selectedClass !== '_all' ? subjectsForClass(selectedClass) : [],
    [selectedClass, subjectsForClass]
  );

  const failedStudents = useMemo(() => {
    let filtered = allFailedStudents;
    if (selectedClass && selectedClass !== '_all') {
      filtered = filtered.filter(f => f.student.class === selectedClass);
    }
    if (selectedSubject && selectedSubject !== '_all') {
      filtered = filtered.filter(f => f.evaluation.subject === selectedSubject);
    }
    return filtered;
  }, [allFailedStudents, selectedClass, selectedSubject]);

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubject('_all');
  };

  const scheduledCount = failedStudents.filter(f => {
    const m = getStudentMark(f.student.id, f.evaluation.id);
    return f.failedOutcomes.some(name => m?.outcomeMarks[name]?.reExamDate);
  }).length;

  const pendingCount = failedStudents.filter(f => {
    const m = getStudentMark(f.student.id, f.evaluation.id);
    return f.failedOutcomes.some(name => {
      const om = m?.outcomeMarks[name];
      return om?.reExamDate && !om?.reExamMark;
    });
  }).length;

  return (
    <motion.div
      key="re-exam-portal-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Re-Examination Management</h1>
          <p className="text-xs text-slate-500">Coordinate and score supplemental sessions for failed learning outcome targets.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Class</label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Classes</SelectItem>
                {assignedClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-[#ba1a1a]/10 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900 text-[#ba1a1a] dark:text-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Failed</p>
            <h4 className="text-2xl font-extrabold text-[#ba1a1a] dark:text-red-400 mt-1">{failedStudents.length} Students</h4>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Grading</p>
            <h4 className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 mt-1">
              {failedStudents.filter(f => {
                const m = getStudentMark(f.student.id, f.evaluation.id);
                return f.failedOutcomes.some(name => {
                  const om = m?.outcomeMarks[name];
                  return om?.reExamDate && !om?.reExamMark;
                });
              }).length} Pending
            </h4>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Scheduled</p>
            <h4 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">
              {failedStudents.filter(f => {
                const m = getStudentMark(f.student.id, f.evaluation.id);
                return f.failedOutcomes.some(name => m?.outcomeMarks[name]?.reExamDate);
              }).length} Scheduled
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Failed Students List */}
        <div className="lg:col-span-12 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Failed Students Registry</h3>
            <p className="text-[10px] text-slate-400 mt-1">Click View to enter re-exam marks for each student</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border max-h-[500px] overflow-y-auto">
            {failedStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No failed students found.</div>
            ) : (
              failedStudents.map((item, idx) => (
                <div
                  key={`${item.student.id}-${item.evaluation.id}`}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-[#002045] dark:text-white">{item.student.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{item.student.rollNo} · {item.student.class}</div>
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold mt-1">
                      {item.evaluation.subject} · {item.failedOutcomes.length} failed
                    </div>
                  </div>
                  <Link
                    href={`/teacher/mark-entry/${item.student.id}?evalId=${item.evaluation.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#002045] hover:bg-opacity-90 rounded border transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
