'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { buttonVariants } from '@/components/shared/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/shared/ui/table';

interface CompiledResult {
  rollNo: string;
  studentId: string;
  studentName: string;
  subjectMarks: Record<string, number | null>;
  totalObtained: number;
  totalFull: number;
  average: number;
  percentage: number;
  grade: string;
  result: 'Pass' | 'Fail' | 'Pending';
}

export default function ResultCompilationTab() {
  const { data: templatesData = [], isLoading: isLoadingEvals } = useEvaluationTemplates();
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents({ limit: 500 });
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 2000 });

  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  // Map raw results → outcomeMarks lookup: [studentId][evaluationTemplateId] = marksObtained
  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, number | null>> = {};
    resultsData.forEach(r => {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      lookup[r.syncedStudentId][r.evaluationTemplateId] = r.marksObtained;
    });
    return lookup;
  }, [resultsData]);

  const allClasses = useMemo(() => [...new Set(students.map(s => s.grade))], [students]);
  const allSubjects = useMemo(() => [...new Set(templatesData.map(t => t.syncedSubject?.name ?? 'Unknown'))], [templatesData]);

  const toggleSubject = (subject: string) =>
    setSelectedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);

  const toggleEvaluation = (evalId: string) =>
    setSelectedEvaluations(prev => prev.includes(evalId) ? prev.filter(id => id !== evalId) : [...prev, evalId]);

  const filteredTemplates = useMemo(() =>
    templatesData.filter(t =>
      selectedSubjects.length === 0 || selectedSubjects.includes(t.syncedSubject?.name ?? 'Unknown')
    ),
    [templatesData, selectedSubjects]
  );

  const compiledResults = useMemo((): CompiledResult[] => {
    if (selectedEvaluations.length === 0) return [];

    const selectedTemplates = templatesData.filter(t => selectedEvaluations.includes(t.id));
    const filteredStudents = selectedClass !== 'all'
      ? students.filter(s => s.grade === selectedClass)
      : students;

    return filteredStudents.map(student => {
      const subjectMarks: Record<string, number | null> = {};
      let totalObtained = 0;
      let totalFull = 0;
      let hasAnyMarks = false;
      let hasFailed = false;

      selectedTemplates.forEach(t => {
        const obtained = marksLookup[student.id]?.[t.id] ?? null;
        const subject = t.syncedSubject?.name ?? 'Unknown';
        subjectMarks[subject] = obtained;

        if (obtained !== null) {
          hasAnyMarks = true;
          totalObtained += obtained;
          totalFull += Number(t.fullMarks);
          if (obtained < Number(t.passMarks)) hasFailed = true;
        } else {
          totalFull += Number(t.fullMarks);
        }
      });

      const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
      const average = selectedTemplates.length > 0 ? totalObtained / selectedTemplates.length : 0;

      let grade = 'N/A';
      if (hasAnyMarks) {
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C+';
        else if (percentage >= 40) grade = 'C';
        else grade = 'D';
      }

      return {
        rollNo: student.rollNumber,
        studentId: student.id,
        studentName: student.name,
        subjectMarks,
        totalObtained,
        totalFull,
        average,
        percentage,
        grade,
        result: !hasAnyMarks ? 'Pending' : hasFailed ? 'Fail' : 'Pass',
      };
    });
  }, [selectedEvaluations, templatesData, students, marksLookup, selectedClass]);

  return (
    <motion.div
      key="result-compilation"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Result Compilation</h1>
          <p className="text-sm text-muted-foreground mt-1">View all evaluations created by teachers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Evaluations</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">{templatesData.length}</h4>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Active Evaluations</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">
              {templatesData.filter(t => t.isActive).length}
            </h4>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Unique Subjects</p>
            <h4 className="text-2xl font-extrabold text-foreground mt-1">{allSubjects.length}</h4>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Filter Evaluations</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Subjects (Multiple)</label>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                    selectedSubjects.includes(subject)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-foreground border-input hover:bg-muted"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
            {selectedSubjects.length > 0 && (
              <button onClick={() => setSelectedSubjects([])} className="text-xs text-destructive hover:underline">
                Clear all subjects
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(t => (
          <div
            key={t.id}
            onClick={() => toggleEvaluation(t.id)}
            className={cn(
              "bg-card text-card-foreground border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer",
              selectedEvaluations.includes(t.id)
                ? "border-primary ring-2 ring-primary"
                : "border-border"
            )}
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {selectedEvaluations.includes(t.id) && <CheckCircle className="w-4 h-4 text-primary" />}
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit border",
                      t.isActive
                        ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border-emerald-250 dark:border-emerald-900/40"
                        : "bg-muted text-muted-foreground border-border"
                    )}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-[10px] font-mono block">
                    {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-muted text-foreground rounded-full uppercase tracking-wider border border-border">
                  {t.syncedSubject?.name ?? 'Unknown'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-1">{t.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Grade: {t.gradeConfig?.gradeLevel ?? '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Max Marks</span>
                  <span className="font-bold text-xs text-foreground font-mono">{t.fullMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Pass Marks</span>
                  <span className="font-bold text-xs text-foreground font-mono">{t.passMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Weightage</span>
                  <span className="font-bold text-xs text-primary font-mono">{t.weightage}%</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Academic Year</span>
                  <span className="font-bold text-xs text-primary font-mono">{t.gradeConfig?.academicYear?.name ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compiled Results Table */}
      {selectedEvaluations.length > 0 && compiledResults.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Compiled Results ({compiledResults.length} students)
            </h3>
            <button onClick={() => setSelectedEvaluations([])} className="text-xs text-destructive hover:underline">
              Clear selection
            </button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Roll No</TableHead>
                <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Student Name</TableHead>
                {templatesData.filter(t => selectedEvaluations.includes(t.id)).map(t => (
                  <TableHead key={t.id} className="border border-border px-3 py-2 text-center font-bold text-foreground">
                    {t.syncedSubject?.name ?? 'Unknown'}
                  </TableHead>
                ))}
                <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Total</TableHead>
                <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Average</TableHead>
                <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Percentage</TableHead>
                <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Grade</TableHead>
                <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compiledResults.map(result => (
                <TableRow key={result.studentId} className="hover:bg-muted/20">
                  <TableCell className="border border-border px-3 py-2 text-foreground">{result.rollNo}</TableCell>
                  <TableCell className="border border-border px-3 py-2 text-foreground">{result.studentName}</TableCell>
                  {templatesData.filter(t => selectedEvaluations.includes(t.id)).map(t => (
                    <TableCell key={t.id} className="border border-border px-3 py-2 text-center text-foreground">
                      {result.subjectMarks[t.syncedSubject?.name ?? 'Unknown'] ?? '-'}
                    </TableCell>
                  ))}
                  <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                    {result.totalObtained}/{result.totalFull}
                  </TableCell>
                  <TableCell className="border border-border px-3 py-2 text-center text-foreground">
                    {result.average.toFixed(1)}
                  </TableCell>
                  <TableCell className="border border-border px-3 py-2 text-center text-foreground">
                    {result.percentage.toFixed(1)}%
                  </TableCell>
                  <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                    {result.grade}
                  </TableCell>
                  <TableCell className={cn(
                    "border border-border px-3 py-2 text-center font-bold",
                    result.result === 'Pass' ? "text-emerald-650 dark:text-emerald-450" :
                    result.result === 'Fail' ? "text-destructive" :
                    "text-muted-foreground"
                  )}>
                    {result.result}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
