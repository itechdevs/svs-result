'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ClipboardList, Eye, ClipboardX } from 'lucide-react';
import { Allocation, EvaluationPlan } from '@/types/academic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  teacher: Allocation;
  evaluations: EvaluationPlan[];
  onView?: (evaluation: EvaluationPlan) => void;
}

export default function TeacherEvaluationsViewTab({ teacher, evaluations, onView }: Props) {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Derive unique classes and subjects from the evaluations themselves
  const uniqueClasses = useMemo(() =>
    Array.from(new Set(evaluations.map(e => e.gradeLevel).filter(Boolean) as string[])).sort(),
    [evaluations]
  );
  const uniqueSubjects = useMemo(() =>
    Array.from(new Set(evaluations.map(e => e.subject).filter(Boolean))).sort(),
    [evaluations]
  );

  const filteredEvaluations = useMemo(() => {
    return evaluations
      .filter(evaluation => {
        const matchesClass = selectedClass === 'all' || evaluation.gradeLevel === selectedClass;
        const matchesSubject = selectedSubject === 'all' || evaluation.subject === selectedSubject;
        return matchesClass && matchesSubject;
      })
      .sort((a, b) => {
        // Primary: createdAt ISO timestamp (newest first)
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdB !== createdA) return createdB - createdA;
        // Fallback: scheduled date
        const dateA = a.date !== 'TBD' && a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date !== 'TBD' && b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        // Stable tiebreaker: id
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
  }, [evaluations, selectedClass, selectedSubject]);

  const initials = teacher.teacher
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
          className="p-1.5 hover:bg-muted rounded-full transition-colors border border-border"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {teacher.teacher}&apos;s Evaluation History
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{teacher.title} · View Only</p>
        </div>
      </div>

      {/* Teacher Info Card */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border-2 border-primary/20">
            <span className="text-base font-extrabold text-primary">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-foreground">{teacher.teacher}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{teacher.title}</p>
            <div className="flex flex-wrap gap-3 mt-2">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <BookOpen className="w-3 h-3 text-primary/70" />
                <span className="font-semibold text-foreground">{teacher.classes.length}</span>
                <span>class{teacher.classes.length !== 1 ? 'es' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <ClipboardList className="w-3 h-3 text-purple-500/70" />
                <span className="font-semibold text-foreground">{teacher.subjects.length}</span>
                <span>subject{teacher.subjects.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Eye className="w-3 h-3 text-blue-500/70" />
                <span className="font-semibold text-foreground">{evaluations.length}</span>
                <span>evaluation plan{evaluations.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {evaluations.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-card-foreground">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Filter Evaluations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Evaluations Table */}
      <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Evaluation Plans ({filteredEvaluations.length})
          </h3>
          {evaluations.length > 0 && filteredEvaluations.length !== evaluations.length && (
            <span className="text-[10px] text-muted-foreground">
              Showing {filteredEvaluations.length} of {evaluations.length}
            </span>
          )}
        </div>

        {evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ClipboardX className="w-10 h-10 text-muted-foreground/40" />
            <p className="font-semibold text-muted-foreground">No evaluations created yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-xs">
              This teacher has not created any evaluation plans. They will appear here once created.
            </p>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">No evaluations found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Class</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Tasks</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Full Marks</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEvaluations.map(evaluation => (
                  <tr key={evaluation.id} className="hover:bg-muted/20 transition-colors">
                    {/* Title */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{evaluation.title}</p>
                      {evaluation.unit && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{evaluation.unit}</p>
                      )}
                    </td>

                    {/* Subject */}
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded">
                        {evaluation.subject}
                      </span>
                    </td>

                    {/* Class (Grade Level) */}
                    <td className="px-5 py-4">
                      {evaluation.gradeLevel ? (
                        <span className="px-2 py-1 text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded">
                          {evaluation.gradeLevel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Test Types */}
                    <td className="px-5 py-4 text-center font-mono text-xs text-muted-foreground">
                      {evaluation.testTypes}
                    </td>

                    {/* Full Marks */}
                    <td className="px-5 py-4 text-center font-mono text-xs text-muted-foreground">
                      {evaluation.fullMarks}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {evaluation.date}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/admin/mark-entry?class=${encodeURIComponent(evaluation.gradeLevel ?? teacher.classes[0])}&subject=${encodeURIComponent(evaluation.subject)}&eval=${encodeURIComponent(evaluation.title)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors border border-blue-200 dark:border-blue-800/50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Marks
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
