'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSearch, Loader2, Save, Check, AlertCircle, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { useAdminTeacherCompilations } from '@/hooks/use-teacher-compilations';
import { useAcademicYears } from '@/hooks/use-academic-config';
import { useExams } from '@/hooks/use-exams';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import ResultCompilationSkeleton from './ResultCompilationSkeleton';
import { Button } from '@/components/shared/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/shared/ui/table';
import { Student } from '@/types/academic';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { buildMergedScores, computeGpa } from '@/lib/transcript-utils';

const TranscriptModal = dynamic(() => import('@/components/shared/TranscriptModal'), { ssr: false });

interface SubjectResult {
  subjectName: string;
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
}

interface CompiledResult {
  rollNo: string;
  studentId: string;
  studentName: string;
  subjects: Record<string, SubjectResult>;
  overallPercentage: number;
  overallGrade: string;
  result: 'Pass' | 'Fail' | 'Pending';
}

function toStudentObj(result: CompiledResult, selectedClass: string, students: any[]): Student {
  return {
    id: result.studentId,
    name: result.studentName,
    rollNo: result.rollNo,
    avatar: '',
    status: 'Active Enrollment',
    class: selectedClass === 'all' ? (students.find((s: any) => s.id === result.studentId)?.class ?? '') : selectedClass,
    attendance: '100%',
    department: 'General',
    overallTotal: '',
    overallPercent: result.overallPercentage,
    grade: result.overallGrade,
    resultStatus: result.result === 'Pass' ? 'PROMOTED' : result.result === 'Fail' ? 'FAILED' : 'PENDING',
    remarks: result.result === 'Pass' ? 'Promoted to next grade.' : 'Failed to clear all subjects.',
    scores: Object.values(result.subjects).map(sub => ({
      subject: sub.subjectName, type: 'General',
      obtained: sub.totalObtained, max: sub.totalFull, pass: sub.isPassed,
    })),
    dist: {},
  };
}


export default function ResultCompilationTab() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showTranscriptModal, setShowTranscriptModal] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: academicYears = [], isLoading: academicYearsLoading } = useAcademicYears();
  const { data: exams = [], isLoading: examsLoading } = useExams(selectedAcademicYear ? { academicYearId: selectedAcademicYear } : undefined);
  const { data: templatesData = [], isLoading: templatesLoading } = useEvaluationTemplates(selectedAcademicYear ? { academicYearId: selectedAcademicYear } : {});
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ limit: 500 });
  const { data: resultsData = [], isLoading: resultsLoading } = useStudentEvaluationResults({ limit: 5000 });
  const { data: teacherCompilations = [], isLoading: compilationsLoading } = useAdminTeacherCompilations({
    status: 'SUBMITTED',
    academicYearId: selectedAcademicYear || undefined,
    gradeLevel: selectedClass !== 'all' ? selectedClass : undefined,
  });

  const isLoading = academicYearsLoading || examsLoading || templatesLoading || studentsLoading || resultsLoading || compilationsLoading;

  if (isLoading) {
    return <ResultCompilationSkeleton />;
  }

  React.useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      setSelectedAcademicYear(currentYear ? currentYear.id : academicYears[0].id);
    }
  }, [academicYears, selectedAcademicYear]);

  const prevAcademicYear = React.useRef(selectedAcademicYear);
  React.useEffect(() => {
    if (prevAcademicYear.current !== selectedAcademicYear) {
      prevAcademicYear.current = selectedAcademicYear;
      setSelectedExam('all');
      setSelectedClass('all');
      setShowResults(false);
    }
  }, [selectedAcademicYear]);

  React.useEffect(() => { setShowResults(false); }, [selectedAcademicYear, selectedExam, selectedClass]);

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);
  const allClasses = useMemo(() => [...new Set(students.map((s) => s.class))], [students]);

  const filteredTemplates = useMemo(() => {
    if (selectedExam === 'all') return templatesData;
    return templatesData.filter((t) => !t.examId || t.examId === selectedExam);
  }, [templatesData, selectedExam]);

  const submittedSubjectIds = useMemo(() => {
    const ids = new Set<string>();
    for (const comp of teacherCompilations) {
      if (comp.status === 'SUBMITTED' && comp.syncedSubjectId) ids.add(comp.syncedSubjectId);
    }
    return ids;
  }, [teacherCompilations]);

  const allSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const t of filteredTemplates) {
      if (t.syncedSubject?.name && submittedSubjectIds.has(t.syncedSubject.id))
        subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [filteredTemplates, submittedSubjectIds]);

  const totalSubjectsInTemplates = useMemo(() => {
    const subjectMap = new Map<string, string>();
    for (const t of filteredTemplates) {
      if (t.syncedSubject?.name) subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [filteredTemplates]);

  const filteredStudents = useMemo(() =>
    selectedClass === 'all' ? students : students.filter((s) => s.class === selectedClass),
    [students, selectedClass]);

  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, { marks: number | null; hasReExam: boolean }>> = {};
    resultsData.forEach((r) => {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      const reExamMarks = r.reExamResult?.marksObtained;
      const hasReExam = reExamMarks !== null && reExamMarks !== undefined;
      const effectiveMarks = hasReExam
        ? Number(reExamMarks)
        : r.marksObtained !== null && r.marksObtained !== undefined
          ? Number(r.marksObtained)
          : null;
      lookup[r.syncedStudentId][r.evaluationTemplateId] = {
        marks: effectiveMarks,
        hasReExam,
      };
    });
    return lookup;
  }, [resultsData]);

  const templatesBySubject = useMemo(() => {
    const map = new Map<string, typeof filteredTemplates>();
    for (const t of filteredTemplates) {
      const subjectName = t.syncedSubject?.name ?? 'Unknown';
      if (!map.has(subjectName)) map.set(subjectName, []);
      map.get(subjectName)!.push(t);
    }
    return map;
  }, [filteredTemplates]);

  const lookupGrade = (percent: number): string => {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C+';
    if (percent >= 40) return 'C';
    return 'D';
  };

  const compiledResults = useMemo((): CompiledResult[] => {
    if (filteredStudents.length === 0 || totalSubjectsInTemplates.length === 0) return [];
    return filteredStudents.map((student) => {
      const subjects: Record<string, SubjectResult> = {};
      let totalPercentage = 0, subjectCount = 0, hasAnyMarks = false, anyFailed = false;
      for (const subject of totalSubjectsInTemplates) {
        const templates = templatesBySubject.get(subject.name) ?? [];
        if (templates.length === 0) continue;
        let weightedObtained = 0, weightedFull = 0, failedEvals = 0, subjectHasMarks = false;
        for (const t of templates) {
          const lookup = marksLookup[student.id]?.[t.id];
          const obtained = lookup?.marks ?? null;
          const fullMarks = Number(t.fullMarks);
          const weight = Number(t.weightage) / 100;
          weightedFull += fullMarks * weight;
          if (obtained !== null) {
            subjectHasMarks = true; hasAnyMarks = true;
            weightedObtained += (obtained / fullMarks) * fullMarks * weight;
            if (obtained < Number(t.passMarks)) failedEvals++;
          }
        }
        const percentage = weightedFull > 0 ? Number(((weightedObtained / weightedFull) * 100).toFixed(1)) : 0;
        const grade = subjectHasMarks ? lookupGrade(percentage) : 'N/A';
        const isPassed = subjectHasMarks && failedEvals === 0;
        if (subjectHasMarks) { totalPercentage += percentage; subjectCount++; }
        if (!isPassed && subjectHasMarks) anyFailed = true;
        subjects[subject.name] = {
          subjectName: subject.name,
          totalObtained: Number(weightedObtained.toFixed(2)),
          totalFull: Number(weightedFull.toFixed(2)),
          percentage, grade, isPassed,
        };
      }
      const overallPercentage = subjectCount > 0 ? Number((totalPercentage / subjectCount).toFixed(1)) : 0;
      return {
        rollNo: student.rollNumber, studentId: student.id, studentName: student.name, subjects,
        overallPercentage, overallGrade: hasAnyMarks ? lookupGrade(overallPercentage) : 'N/A',
        result: !hasAnyMarks ? 'Pending' : anyFailed ? 'Fail' : 'Pass',
      };
    });
  }, [filteredStudents, totalSubjectsInTemplates, templatesBySubject, marksLookup]);

  const selectedExamName = useMemo(() =>
    selectedExam === 'all' ? 'All Exams' : (exams.find((e) => e.id === selectedExam)?.name ?? 'All Exams'),
    [selectedExam, exams]);

  const selectedClassName = selectedClass === 'all' ? 'All Classes' : selectedClass;

  const allSelected = compiledResults.length > 0 && selectedIds.size === compiledResults.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(compiledResults.map(r => r.studentId)));
  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleCompile = useCallback(() => {
    if (!selectedAcademicYear) { toast.error('Please select an academic year'); return; }
    if (filteredTemplates.length === 0) { toast.error('No evaluation templates found for the selected filters.'); return; }
    if (filteredStudents.length === 0) { toast.error('No students found for the selected class.'); return; }
    setIsCompiling(true); setShowResults(false);
    setTimeout(() => { setIsCompiling(false); setShowResults(true); }, 1500);
  }, [selectedAcademicYear, filteredTemplates.length, filteredStudents.length]);

  const handleSaveCompilation = async () => {
    if (!selectedAcademicYear) { toast.error('Please select an academic year'); return; }
    if (compiledResults.length === 0) { toast.error('No results to save'); return; }
    setIsSaving(true);
    try {
      await apiClient.post('/admin/final-compilation', {
        academicYearId: selectedAcademicYear,
        examId: selectedExam !== 'all' ? selectedExam : undefined,
        gradeLevel: selectedClass === 'all' ? (filteredStudents[0]?.class ?? 'Unknown') : selectedClass,
        students: compiledResults.map((r) => ({
          studentId: r.studentId,
          subjects: Object.fromEntries(Object.entries(r.subjects).map(([name, data]) => [name, {
            subjectId: totalSubjectsInTemplates.find((s) => s.name === name)?.id ?? '',
            totalObtained: data.totalObtained, totalFull: data.totalFull,
            percentage: data.percentage, grade: data.grade, isPassed: data.isPassed, failedEvaluations: 0,
          }])),
          overallPercentage: r.overallPercentage, overallGrade: r.overallGrade, cgpa: undefined,
          resultStatus: r.result === 'Pass' ? 'PROMOTED' : r.result === 'Fail' ? 'FAILED' : 'PENDING',
        })),
      });
      toast.success(`Successfully saved ${compiledResults.length} student results`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save compilation');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkDownload = async () => {
    const selected = compiledResults.filter(r => selectedIds.has(r.studentId));
    if (!selected.length) return;
    setBulkLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { GradeSheetPDF } = await import('@/components/shared/GradeSheetPDF');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      await Promise.all(selected.map(async result => {
        const studentObj = toStudentObj(result, selectedClass, students);
        const scores = buildMergedScores(studentObj.scores);
        const gpa = computeGpa(scores);
        const blob = await pdf(<GradeSheetPDF student={studentObj} mergedScoresList={scores} gpa={gpa} rank={3} />).toBlob();
        zip.file(`GradeSheet_${result.studentName}_${result.rollNo}.pdf`, blob);
      }));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url; a.download = 'GradeSheets.zip'; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBulkLoading(false);
    }
  };


  return (
    <motion.div
      key="result-compilation"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Result Compilation</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Select filters and compile student results</p>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Academic Year</label>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select Year" /></SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>{year.name} {year.isCurrent && '(Current)'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Exam</label>
            <Select value={selectedExam} onValueChange={setSelectedExam} disabled={!selectedAcademicYear}>
              <SelectTrigger className="w-full text-sm"><SelectValue placeholder="All Exams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name} ({exam.gradeLevel})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAcademicYear && exams.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No exams found. <a href="/admin/exams" className="text-primary underline">Create an exam</a> for this year first.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full text-sm"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {allClasses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            {!showResults && !isCompiling && (
              <Button onClick={handleCompile} disabled={!selectedAcademicYear} className="w-full flex items-center gap-2">
                <FileSearch className="w-4 h-4" />Compile Results
              </Button>
            )}
            {showResults && (
              <Button onClick={() => setShowResults(false)} variant="outline" className="w-full flex items-center gap-2">
                <FileSearch className="w-4 h-4" />Recompile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Subject Submission Status */}
      {selectedAcademicYear && totalSubjectsInTemplates.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Subject Submission Status</h3>
            <span className="text-xs text-muted-foreground">
              {allSubjects.length} of {totalSubjectsInTemplates.length} subjects submitted
              {selectedClassName !== 'All Classes' && ` · ${selectedClassName}`}
              {selectedExamName !== 'All Exams' && ` · ${selectedExamName}`}
            </span>
          </div>
          {allSubjects.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <AlertCircle className="w-4 h-4" />No subjects have been submitted by teachers yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {allSubjects.map((subject) => {
                  const comp = teacherCompilations.find((c) => c.subject.name === subject.name);
                  return (
                    <div key={subject.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                      <Check className="w-3 h-3" />{subject.name}
                      {comp && <span className="text-emerald-500 dark:text-emerald-400 ml-1">({comp.teacher.name})</span>}
                    </div>
                  );
                })}
              </div>
              {totalSubjectsInTemplates.length > allSubjects.length && (
                <div className="flex flex-wrap gap-2">
                  {totalSubjectsInTemplates.filter((s) => !allSubjects.some((sub) => sub.id === s.id)).map((subject) => (
                    <div key={subject.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-muted-foreground text-xs font-medium">
                      {subject.name}<span className="text-[10px]">(not submitted)</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Compiling Animation */}
      <AnimatePresence mode="wait">
        {isCompiling && (
          <motion.div key="compiling-progress" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-10">
            <div className="flex flex-col items-center justify-center gap-6">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Loader2 className="w-12 h-12 text-primary" />
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-foreground">Compiling Results...</h3>
                <p className="text-sm text-muted-foreground">Processing student marks and computing grades</p>
              </div>
              <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {showResults && compiledResults.length === 0 && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-10 text-center">
          <FileSearch className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">No Results Found</h3>
          <p className="text-xs text-muted-foreground mt-1">No student marks available for the selected filters.</p>
        </div>
      )}

      {/* Results Table */}
      <AnimatePresence>
        {showResults && compiledResults.length > 0 && (
          <motion.div key="compiled-results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Compiled Results ({compiledResults.length} students · {totalSubjectsInTemplates.length} subjects)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button onClick={handleBulkDownload} disabled={bulkLoading} variant="outline"
                    className="flex items-center gap-2 border-[#002045] text-[#002045] hover:bg-slate-50 h-9 py-2 text-xs font-semibold cursor-pointer">
                    <FileDown className="w-4 h-4" />
                    {bulkLoading ? 'Generating...' : `Download ${selectedIds.size} PDF${selectedIds.size > 1 ? 's' : ''}`}
                  </Button>
                )}
                <Button onClick={handleSaveCompilation} disabled={isSaving || !selectedAcademicYear} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />{isSaving ? 'Saving...' : 'Save to Database'}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="border border-border px-3 py-2 text-center w-10">
                      <input type="checkbox" checked={allSelected} ref={(el) => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleAll} className="cursor-pointer accent-[#002045]" />
                    </TableHead>
                    <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-0 bg-muted/40">Roll No</TableHead>
                    <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-[60px] bg-muted/40">Student Name</TableHead>
                    {totalSubjectsInTemplates.map((s) => (
                      <TableHead key={s.id} className="border border-border px-3 py-2 text-center font-bold text-foreground">{s.name}</TableHead>
                    ))}
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Overall %</TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Grade</TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Result</TableHead>
                    <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compiledResults.map((result) => (
                    <TableRow key={result.studentId} className={cn('hover:bg-muted/20', selectedIds.has(result.studentId) && 'bg-blue-50/40 dark:bg-blue-950/20')}>
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <input type="checkbox" checked={selectedIds.has(result.studentId)} onChange={() => toggleSelect(result.studentId)} className="cursor-pointer accent-[#002045]" />
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground sticky left-0 bg-background">{result.rollNo}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground sticky left-[60px] bg-background">{result.studentName}</TableCell>
                      {totalSubjectsInTemplates.map((s) => {
                        const sub = result.subjects[s.name];
                        return (
                          <TableCell key={s.id} className="border border-border px-3 py-2 text-center text-foreground">
                            {sub ? <span className={cn('font-mono text-xs', !sub.isPassed && sub.subjectName && 'text-destructive')}>{sub.percentage.toFixed(1)}%</span> : '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">{result.overallPercentage}%</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">{result.overallGrade}</TableCell>
                      <TableCell className={cn('border border-border px-3 py-2 text-center font-bold',
                        result.result === 'Pass' ? 'text-emerald-600 dark:text-emerald-400' : result.result === 'Fail' ? 'text-destructive' : 'text-muted-foreground')}>
                        {result.result}
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <button onClick={() => setShowTranscriptModal(toStudentObj(result, selectedClass, students))}
                          className="px-2.5 py-1 bg-[#002045] hover:bg-opacity-95 text-white rounded text-[11px] font-bold cursor-pointer transition-colors">
                          View Grade Sheet
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TranscriptModal showTranscriptModal={showTranscriptModal} setShowTranscriptModal={setShowTranscriptModal} />
    </motion.div>
  );
}
