'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle, Save, Send, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useProfile } from '@/hooks/use-profile';
import { useStudents } from '@/hooks/use-students';
import {
  useTeacherSubjectCompilations,
  useCreateTeacherCompilation,
  useSubmitTeacherCompilation,
} from '@/hooks/use-teacher-compilations';
import { useAcademicYears } from '@/hooks/use-academic-config';
import { useExams } from '@/hooks/use-exams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CompiledStudentResult {
  studentId: string;
  rollNo: string;
  studentName: string;
  subjectMarks: Record<string, number | null>;
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: string;
  result: 'Pass' | 'Fail' | 'Pending';
  failedEvaluations: number;
}

interface Props {
  onBack?: () => void;
}

export default function TeacherResultCompilationTab({ onBack }: Props) {
  const searchParams = useSearchParams();
  const { data: profile } = useProfile();
  const { data: academicYears = [] } = useAcademicYears();

  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') ?? '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') ?? '');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);

  const createCompilation = useCreateTeacherCompilation();
  const submitCompilation = useSubmitTeacherCompilation();

  // Auto-select current academic year
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      if (currentYear) {
        setSelectedAcademicYear(currentYear.id);
      } else {
        setSelectedAcademicYear(academicYears[0].id);
      }
    }
  }, [academicYears, selectedAcademicYear]);

  // Reset exam when academic year changes
  const prevYear = useRef(selectedAcademicYear);
  useEffect(() => {
    if (prevYear.current !== selectedAcademicYear) {
      prevYear.current = selectedAcademicYear;
      setSelectedExam('all');
      setSelectedEvaluations([]);
    }
  }, [selectedAcademicYear]);

  const { data: exams = [] } = useExams(
    selectedAcademicYear ? { academicYearId: selectedAcademicYear } : undefined,
  );
  const { data: templatesData = [] } = useEvaluationTemplates(
    selectedAcademicYear ? { academicYearId: selectedAcademicYear } : {},
  );
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 5000 });
  const { data: studentsData } = useStudents({ limit: 500 });

  // Get existing compilations
  const { data: existingCompilations = [] } = useTeacherSubjectCompilations({
    academicYearId: selectedAcademicYear || undefined,
    gradeLevel: selectedClass || undefined,
  });

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  // Assigned subjects from teacher profile
  const assignedSubjects = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    return Array.from(new Set(subjects.map((s) => ({ id: s.id, name: s.name, gradeLevel: s.gradeLevel }))));
  }, [profile]);

  // Classes from assigned subjects
  const classes = useMemo(() => {
    return Array.from(new Set(assignedSubjects.map((s) => s.gradeLevel)));
  }, [assignedSubjects]);

  // Subjects for selected class
  const subjects = useMemo(() => {
    return assignedSubjects.filter((s) => s.gradeLevel === selectedClass);
  }, [assignedSubjects, selectedClass]);

  // Filtered templates for selected subject + exam
  const filteredTemplates = useMemo(() => {
    if (!selectedSubject) return [];
    return templatesData.filter((t) => {
      if (t.syncedSubject?.name !== selectedSubject) return false;
      if (!t.isActive) return false;
      if (t.gradeConfig?.academicYear?.id && t.gradeConfig.academicYear.id !== selectedAcademicYear) return false;
      if (selectedExam !== 'all' && t.examId && t.examId !== selectedExam) return false;
      return true;
    });
  }, [templatesData, selectedSubject, selectedAcademicYear, selectedExam]);

  // Students for selected class
  const filteredStudents = useMemo(() => {
    return students.filter((s) => s.class === selectedClass);
  }, [students, selectedClass]);

  // Marks lookup: [studentId][templateId] = marksObtained
  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, number | null>> = {};
    for (const r of resultsData) {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      lookup[r.syncedStudentId][r.evaluationTemplateId] =
        r.marksObtained !== null && r.marksObtained !== undefined
          ? Number(r.marksObtained)
          : null;
    }
    return lookup;
  }, [resultsData]);

  // Computed compiled results
  const compiledResults = useMemo((): CompiledStudentResult[] => {
    if (selectedEvaluations.length === 0 || filteredStudents.length === 0) return [];

    const selectedTemplates = templatesData.filter((t) => selectedEvaluations.includes(t.id));

    return filteredStudents.map((student) => {
      const subjectMarks: Record<string, number | null> = {};
      let totalObtained = 0;
      let totalFull = 0;
      let hasAnyMarks = false;
      let hasFailed = false;

      selectedTemplates.forEach((t) => {
        const obtained = marksLookup[student.id]?.[t.id] ?? null;
        subjectMarks[t.name] = obtained;

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
        studentId: student.id,
        rollNo: student.rollNumber,
        studentName: student.name,
        subjectMarks,
        totalObtained,
        totalFull,
        percentage,
        grade,
        result: !hasAnyMarks ? 'Pending' : hasFailed ? 'Fail' : 'Pass',
        failedEvaluations: 0,
      };
    });
  }, [selectedEvaluations, filteredStudents, templatesData, marksLookup]);

  const toggleEvaluation = (evalId: string) =>
    setSelectedEvaluations((prev) =>
      prev.includes(evalId) ? prev.filter((id) => id !== evalId) : [...prev, evalId]
    );

  const handleSaveDraft = async () => {
    if (!selectedSubject || !selectedClass || !selectedAcademicYear || selectedEvaluations.length === 0) {
      toast.error('Please select all filters and at least one evaluation');
      return;
    }

    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj) return;

    await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: selectedClass,
      evaluationTemplateIds: selectedEvaluations,
    });
    toast.success('Draft saved successfully');
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedClass || !selectedAcademicYear || selectedEvaluations.length === 0) {
      toast.error('Please select all filters and at least one evaluation');
      return;
    }

    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj) return;

    const result = await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: selectedClass,
      evaluationTemplateIds: selectedEvaluations,
    });

    if (result?.id) {
      await submitCompilation.mutateAsync(result.id);
      toast.success('Submitted to admin successfully');
    }
  };

  // Find existing compilation for current selection
  const existingCompilation = useMemo(() => {
    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj || !selectedAcademicYear) return null;
    return existingCompilations.find(
      (c) =>
        c.syncedSubjectId === subjectObj.id &&
        c.academicYearId === selectedAcademicYear &&
        c.gradeLevel === selectedClass
    );
  }, [existingCompilations, selectedSubject, selectedClass, selectedAcademicYear, subjects]);

  return (
    <motion.div
      key="result-compilation"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Result Compilation</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Select a subject and evaluations to compile results
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Class
            </label>
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSubject(''); setSelectedEvaluations([]); }}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select a class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Subject
            </label>
            <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedEvaluations([]); }} disabled={!selectedClass}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder={selectedClass ? "Select a subject..." : "Select a class first"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Exam
            </label>
            <Select value={selectedExam} onValueChange={(v) => { setSelectedExam(v); setSelectedEvaluations([]); }}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Academic Year
            </label>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select academic year..." />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name} {y.isCurrent && '(Current)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Existing compilation status */}
      {existingCompilation && (
        <div className={cn(
          "rounded-xl border p-4 flex items-center gap-3",
          existingCompilation.status === 'SUBMITTED'
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
            : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
        )}>
          {existingCompilation.status === 'SUBMITTED' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Save className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {existingCompilation.status === 'SUBMITTED' ? 'Submitted to Admin' : 'Draft Saved'}
            </p>
            <p className="text-xs text-muted-foreground">
              Last computed: {new Date(existingCompilation.computedAt).toLocaleDateString()}
              {existingCompilation.submittedAt && ` · Submitted: ${new Date(existingCompilation.submittedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Evaluation Cards */}
      {selectedSubject && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">Select Evaluations</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allIds = filteredTemplates.map((t) => t.id);
                  setSelectedEvaluations(
                    allIds.length === selectedEvaluations.length ? [] : allIds
                  );
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedEvaluations.length === filteredTemplates.length && filteredTemplates.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleEvaluation(t.id)}
                className={cn(
                  "bg-card border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all",
                  selectedEvaluations.includes(t.id)
                    ? "border-primary ring-2 ring-primary"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {selectedEvaluations.includes(t.id) && <CheckCircle className="w-4 h-4 text-primary" />}
                  <span className="font-bold text-sm text-foreground line-clamp-1">{t.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="font-bold text-muted-foreground uppercase">Max Marks</span>
                    <p className="font-mono text-foreground">{t.fullMarks}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground uppercase">Pass Marks</span>
                    <p className="font-mono text-foreground">{t.passMarks}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground uppercase">Weightage</span>
                    <p className="font-mono text-primary">{t.weightage}%</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground uppercase">Subject</span>
                    <p className="font-mono text-foreground">{t.syncedSubject?.name ?? '—'}</p>
                  </div>
                  {t.exam && (
                    <div className="col-span-2">
                      <span className="font-bold text-muted-foreground uppercase">Exam</span>
                      <p className="font-mono text-foreground">{t.exam.name}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                No evaluation templates found for this subject{selectedExam !== 'all' ? ' and exam' : ''}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compiled Results Table */}
      {selectedEvaluations.length > 0 && compiledResults.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">
              Compiled Results ({compiledResults.length} students)
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveDraft}
                disabled={createCompilation.isPending}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitCompilation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {existingCompilation?.status === 'SUBMITTED' ? 'Re-Submit to Admin' : 'Submit to Admin'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="border border-border px-3 py-2 text-left font-bold text-foreground">Roll No</th>
                  <th className="border border-border px-3 py-2 text-left font-bold text-foreground">Student Name</th>
                  {filteredTemplates.filter((t) => selectedEvaluations.includes(t.id)).map((t) => (
                    <th key={t.id} className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      {t.name}
                    </th>
                  ))}
                  <th className="border border-border px-3 py-2 text-center font-bold text-foreground">Total</th>
                  <th className="border border-border px-3 py-2 text-center font-bold text-foreground">Percentage</th>
                  <th className="border border-border px-3 py-2 text-center font-bold text-foreground">Grade</th>
                  <th className="border border-border px-3 py-2 text-center font-bold text-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {compiledResults.map((result) => (
                  <tr key={result.studentId} className="hover:bg-muted/20">
                    <td className="border border-border px-3 py-2 text-foreground">{result.rollNo}</td>
                    <td className="border border-border px-3 py-2 text-foreground">{result.studentName}</td>
                    {filteredTemplates.filter((t) => selectedEvaluations.includes(t.id)).map((t) => (
                      <td key={t.id} className="border border-border px-3 py-2 text-center text-foreground">
                        {result.subjectMarks[t.name] ?? '-'}
                      </td>
                    ))}
                    <td className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                      {result.totalObtained}/{result.totalFull}
                    </td>
                    <td className="border border-border px-3 py-2 text-center text-foreground">
                      {result.percentage.toFixed(1)}%
                    </td>
                    <td className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                      {result.grade}
                    </td>
                    <td className={cn(
                      "border border-border px-3 py-2 text-center font-bold",
                      result.result === 'Pass' ? "text-emerald-600 dark:text-emerald-400" :
                      result.result === 'Fail' ? "text-destructive" :
                      "text-muted-foreground"
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
