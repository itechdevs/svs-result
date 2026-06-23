'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Allocation, EvaluationPlan } from '@/types/academic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

interface Props {
  teacher: Allocation;
  evaluations: EvaluationPlan[];
  onView?: (evaluation: EvaluationPlan) => void;
}

export default function TeacherEvaluationsViewTab({ teacher, evaluations, onView }: Props) {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const matchesClass = selectedClass === 'all' || teacher.classes.includes(selectedClass);
      const matchesSubject = selectedSubject === 'all' || evaluation.subject === selectedSubject;
      return matchesClass && matchesSubject;
    });
  }, [evaluations, selectedClass, selectedSubject, teacher.classes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/allocations"
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors border border-slate-200 dark:border-border"
        >
          <ArrowLeft className="w-4 h-4 text-[#002045] dark:text-blue-300" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {teacher.teacher}'s Evaluation Boards
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{teacher.title} · View Only</p>
        </div>
      </div>

      {/* Teacher Info Card */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
            <img src={teacher.avatar} alt={teacher.teacher} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">{teacher.teacher}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{teacher.title}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                <BookOpen className="w-3 h-3" />
                <span className="font-semibold">{teacher.classes.length} Classes</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400">
                <ClipboardList className="w-3 h-3" />
                <span className="font-semibold">{teacher.subjects.length} Subjects</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-card-foreground">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Filter Evaluations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {teacher.classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <SelectItem value="all">All Subjects</SelectItem>
                {teacher.subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/40">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Evaluation Boards ({filteredEvaluations.length})
          </h3>
        </div>

        {filteredEvaluations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400">No evaluations found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-border">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Test Types</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Outcomes</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border">
                {filteredEvaluations.map(evaluation => (
                  <tr key={evaluation.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#002045] dark:text-white">{evaluation.title}</p>
                      {evaluation.unit && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{evaluation.unit}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded">
                        {evaluation.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {evaluation.testTypes}
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                      {evaluation.outcomes}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {evaluation.date}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/admin/mark-entry?class=${encodeURIComponent(teacher.classes[0])}&subject=${encodeURIComponent(evaluation.subject)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
