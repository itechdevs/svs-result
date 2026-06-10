'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

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
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Result Compilation</h1>
          <p className="text-xs text-slate-500">View all evaluations created by teachers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Evaluations</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">{templatesData.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Evaluations</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">
              {templatesData.filter(t => t.isActive).length}
            </h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Unique Subjects</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">{allSubjects.length}</h4>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
        <h3 className="text-xs font-bold text-[#002045] dark:text-white uppercase tracking-wider mb-3">Filter Evaluations</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Class</label>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Subjects (Multiple)</label>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
                    selectedSubjects.includes(subject)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
            {selectedSubjects.length > 0 && (
              <button onClick={() => setSelectedSubjects([])} className="text-xs text-red-600 dark:text-red-400 hover:underline">
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
              "bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer",
              selectedEvaluations.includes(t.id)
                ? "border-blue-500 ring-2 ring-blue-500"
                : "border-slate-200 dark:border-border"
            )}
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {selectedEvaluations.includes(t.id) && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                      t.isActive ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                    )}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-mono block">
                    {t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#002045] dark:text-blue-300 rounded-full uppercase tracking-wider border dark:border-border">
                  {t.syncedSubject?.name ?? 'Unknown'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#002045] dark:text-white leading-snug line-clamp-1">{t.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Grade: {t.gradeConfig?.gradeLevel ?? '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-border">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Max Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{t.fullMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Pass Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{t.passMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Weightage</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{t.weightage}%</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Academic Year</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{t.gradeConfig?.academicYear?.name ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compiled Results Table */}
      {selectedEvaluations.length > 0 && compiledResults.length > 0 && (
        <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#002045] dark:text-white uppercase tracking-wider">
              Compiled Results ({compiledResults.length} students)
            </h3>
            <button onClick={() => setSelectedEvaluations([])} className="text-xs text-red-600 dark:text-red-400 hover:underline">
              Clear selection
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40">
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-left font-bold text-[#002045] dark:text-white">Roll No</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-left font-bold text-[#002045] dark:text-white">Student Name</th>
                  {templatesData.filter(t => selectedEvaluations.includes(t.id)).map(t => (
                    <th key={t.id} className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">
                      {t.syncedSubject?.name ?? 'Unknown'}
                    </th>
                  ))}
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">Total</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">Average</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">Percentage</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">Grade</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">Result</th>
                </tr>
              </thead>
              <tbody>
                {compiledResults.map(result => (
                  <tr key={result.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-slate-700 dark:text-slate-300">{result.rollNo}</td>
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-slate-700 dark:text-slate-300">{result.studentName}</td>
                    {templatesData.filter(t => selectedEvaluations.includes(t.id)).map(t => (
                      <td key={t.id} className="border border-slate-200 dark:border-border px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                        {result.subjectMarks[t.syncedSubject?.name ?? 'Unknown'] ?? '-'}
                      </td>
                    ))}
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {result.totalObtained}/{result.totalFull}
                    </td>
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                      {result.average.toFixed(1)}
                    </td>
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                      {result.percentage.toFixed(1)}%
                    </td>
                    <td className="border border-slate-200 dark:border-border px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {result.grade}
                    </td>
                    <td className={cn(
                      "border border-slate-200 dark:border-border px-3 py-2 text-center font-bold",
                      result.result === 'Pass' ? "text-green-600 dark:text-green-400" :
                      result.result === 'Fail' ? "text-red-600 dark:text-red-400" :
                      "text-slate-400"
                    )}>
                      {result.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
