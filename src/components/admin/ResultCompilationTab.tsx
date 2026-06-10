'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAcademicContext } from '@/contexts/AcademicContext';
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
  const { evaluations, students, studentMarks } = useAcademicContext();
  
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);

  // Extract unique classes and subjects
  const allClasses = useMemo(() => {
    return [...new Set(students.map(s => s.class))];
  }, [students]);

  const allSubjects = useMemo(() => {
    return [...new Set(evaluations.map(e => e.subject))];
  }, [evaluations]);

  // Toggle subject selection
  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  // Toggle evaluation selection
  const toggleEvaluation = (evalId: string) => {
    setSelectedEvaluations(prev =>
      prev.includes(evalId)
        ? prev.filter(id => id !== evalId)
        : [...prev, evalId]
    );
  };

  // Filter evaluations
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const matchesSubject = selectedSubjects.length === 0 || selectedSubjects.includes(evaluation.subject);
      return matchesSubject;
    });
  }, [evaluations, selectedSubjects]);

  // Compile student-wise results
  const compiledResults = useMemo((): CompiledResult[] => {
    if (selectedEvaluations.length === 0) return [];

    const selectedEvalsData = evaluations.filter(e => selectedEvaluations.includes(e.id));
    const classFilter = selectedClass !== 'all' ? selectedClass : null;
    const filteredStudents = classFilter 
      ? students.filter(s => s.class === classFilter)
      : students;

    return filteredStudents.map(student => {
      const subjectMarks: Record<string, number | null> = {};
      let totalObtained = 0;
      let totalFull = 0;
      let hasAnyMarks = false;
      let hasFailed = false;

      selectedEvalsData.forEach(evaluation => {
        const marks = studentMarks.find(m => m.studentId === student.id && m.evaluationId === evaluation.id);
        
        if (marks) {
          let obtained = 0;
          let evalFull = 0;
          let evalFailed = false;

          evaluation.learningOutcomes.forEach(lo => {
            const outcomeMark = marks.outcomeMarks[lo.name];
            const mark = outcomeMark?.regularMark ?? null;
            
            if (mark !== null) {
              obtained += mark;
              hasAnyMarks = true;
              
              // Check pass/fail for this outcome
              if (mark < (lo.passMarks ?? 0)) {
                evalFailed = true;
              }
            }
            evalFull += lo.fullMarks ?? 0;
          });

          subjectMarks[evaluation.subject] = obtained;
          totalObtained += obtained;
          totalFull += evalFull;
          
          if (evalFailed) hasFailed = true;
        } else {
          subjectMarks[evaluation.subject] = null;
        }
      });

      const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
      const average = selectedEvalsData.length > 0 ? totalObtained / selectedEvalsData.length : 0;
      
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

      const result: 'Pass' | 'Fail' | 'Pending' = !hasAnyMarks ? 'Pending' : hasFailed ? 'Fail' : 'Pass';

      return {
        rollNo: student.rollNo,
        studentId: student.id,
        studentName: student.name,
        subjectMarks,
        totalObtained,
        totalFull,
        average,
        percentage,
        grade,
        result
      };
    });
  }, [selectedEvaluations, evaluations, students, studentMarks, selectedClass]);

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
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">{evaluations.length}</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Evaluations</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">
              {evaluations.filter(e => e.status === 'Active').length}
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
          {/* Class Filter */}
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

          {/* Multi-Subject Filter */}
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
              <button
                onClick={() => setSelectedSubjects([])}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all subjects
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Evaluations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvaluations.map((evalPlan) => (
          <div
            key={evalPlan.id}
            onClick={() => toggleEvaluation(evalPlan.id)}
            className={cn(
              "bg-white dark:bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col cursor-pointer",
              selectedEvaluations.includes(evalPlan.id)
                ? "border-blue-500 ring-2 ring-blue-500"
                : "border-slate-200 dark:border-border"
            )}
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    {selectedEvaluations.includes(evalPlan.id) && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                      evalPlan.status === 'Active' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350"
                    )}>
                      {evalPlan.status}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[10px] font-mono block">Created: {evalPlan.date}</span>
                </div>

                {/* Subject badge */}
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#002045] dark:text-blue-300 rounded-full uppercase tracking-wider border dark:border-border">
                  {evalPlan.subject}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#002045] dark:text-white leading-snug line-clamp-1">{evalPlan.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Assessment Unit: {evalPlan.unit || "Core Modules"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-border">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Task Types</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{evalPlan.testTypes}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Outcomes tracked</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{evalPlan.outcomes}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Max Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{evalPlan.fullMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Pass Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{evalPlan.passMarks}</span>
                </div>
              </div>

              {/* Preview of what is inside */}
              {evalPlan.learningOutcomes && evalPlan.learningOutcomes.length > 0 && (
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5">Criteria Preview</span>
                  <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                    {evalPlan.learningOutcomes.slice(0, 3).map((lo, idx) => (
                      <li key={idx} className="truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#002045] dark:bg-blue-400 shrink-0" />
                        {lo.name}
                      </li>
                    ))}
                    {evalPlan.learningOutcomes.length > 3 && (
                      <li className="text-[9px] text-slate-400 italic mt-1 pl-2.5">
                        + {evalPlan.learningOutcomes.length - 3} more criteria
                      </li>
                    )}
                  </ul>
                </div>
              )}
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
            <button
              onClick={() => setSelectedEvaluations([])}
              className="text-xs text-red-600 dark:text-red-400 hover:underline"
            >
              Clear selection
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/40">
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-left font-bold text-[#002045] dark:text-white">Roll No</th>
                  <th className="border border-slate-200 dark:border-border px-3 py-2 text-left font-bold text-[#002045] dark:text-white">Student Name</th>
                  {evaluations
                    .filter(e => selectedEvaluations.includes(e.id))
                    .map(e => (
                      <th key={e.id} className="border border-slate-200 dark:border-border px-3 py-2 text-center font-bold text-[#002045] dark:text-white">
                        {e.subject}
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
                    {evaluations
                      .filter(e => selectedEvaluations.includes(e.id))
                      .map(e => (
                        <td key={e.id} className="border border-slate-200 dark:border-border px-3 py-2 text-center text-slate-700 dark:text-slate-300">
                          {result.subjectMarks[e.subject] !== null ? result.subjectMarks[e.subject] : '-'}
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
