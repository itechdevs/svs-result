'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, BookOpen, ClipboardList, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { useAdminTeacherCompilations } from '@/hooks/use-teacher-compilations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/shared/ui/table';
import TranscriptModal from '@/components/shared/TranscriptModal';
import { Student } from '@/types/academic';

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

export default function ResultCompilationTab() {
  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 5000 });
  const { data: teacherCompilations = [] } = useAdminTeacherCompilations({ status: 'SUBMITTED' });

  const [selectedClass, setSelectedClass] = useState('all');
  const [showTranscriptModal, setShowTranscriptModal] = useState<Student | null>(null);

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  const allClasses = useMemo(() => [...new Set(students.map(s => s.grade))], [students]);

  // All subjects present in templates
  const allSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>(); // name -> id
    for (const t of templatesData) {
      if (t.syncedSubject?.name) subjectMap.set(t.syncedSubject.name, t.syncedSubject.id);
    }
    return Array.from(subjectMap.entries()).map(([name, id]) => ({ name, id }));
  }, [templatesData]);

  // Filtered students by class
  const filteredStudents = useMemo(() => {
    return selectedClass === 'all' ? students : students.filter(s => s.grade === selectedClass);
  }, [students, selectedClass]);

  // Build marks lookup: [studentId][templateId] = marksObtained
  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, number | null>> = {};
    resultsData.forEach(r => {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      lookup[r.syncedStudentId][r.evaluationTemplateId] =
        r.marksObtained !== null && r.marksObtained !== undefined ? Number(r.marksObtained) : null;
    });
    return lookup;
  }, [resultsData]);

  // Group templates by subject
  const templatesBySubject = useMemo(() => {
    const map = new Map<string, typeof templatesData>();
    for (const t of templatesData) {
      const subjectName = t.syncedSubject?.name ?? 'Unknown';
      if (!map.has(subjectName)) map.set(subjectName, []);
      map.get(subjectName)!.push(t);
    }
    return map;
  }, [templatesData]);

  // Compute grade from percentage (hardcoded scale)
  const lookupGrade = (percent: number): string => {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C+';
    if (percent >= 40) return 'C';
    return 'D';
  };

  // Compute compiled results: one weighted aggregate per subject per student
  const compiledResults = useMemo((): CompiledResult[] => {
    if (filteredStudents.length === 0 || allSubjects.length === 0) return [];

    return filteredStudents.map(student => {
      const subjects: Record<string, SubjectResult> = {};
      let totalPercentage = 0;
      let subjectCount = 0;
      let hasAnyMarks = false;
      let anyFailed = false;

      for (const subject of allSubjects) {
        const templates = templatesBySubject.get(subject.name) ?? [];
        if (templates.length === 0) continue;

        let weightedObtained = 0;
        let weightedFull = 0;
        let failedEvals = 0;
        let subjectHasMarks = false;

        for (const t of templates) {
          const obtained = marksLookup[student.id]?.[t.id] ?? null;
          const fullMarks = Number(t.fullMarks);
          const weight = Number(t.weightage) / 100;

          weightedFull += fullMarks * weight;

          if (obtained !== null) {
            subjectHasMarks = true;
            hasAnyMarks = true;
            weightedObtained += (obtained / fullMarks) * fullMarks * weight;
            if (obtained < Number(t.passMarks)) failedEvals++;
          }
        }

        const percentage = weightedFull > 0 ? Number(((weightedObtained / weightedFull) * 100).toFixed(1)) : 0;
        const grade = subjectHasMarks ? lookupGrade(percentage) : 'N/A';
        const isPassed = subjectHasMarks && failedEvals === 0;

        if (subjectHasMarks) {
          totalPercentage += percentage;
          subjectCount++;
        }

        if (!isPassed && subjectHasMarks) anyFailed = true;

        subjects[subject.name] = {
          subjectName: subject.name,
          totalObtained: Number(weightedObtained.toFixed(2)),
          totalFull: Number(weightedFull.toFixed(2)),
          percentage,
          grade,
          isPassed,
        };
      }

      const overallPercentage = subjectCount > 0 ? Number((totalPercentage / subjectCount).toFixed(1)) : 0;
      const overallGrade = hasAnyMarks ? lookupGrade(overallPercentage) : 'N/A';

      return {
        rollNo: student.rollNumber,
        studentId: student.id,
        studentName: student.name,
        subjects,
        overallPercentage,
        overallGrade,
        result: !hasAnyMarks ? 'Pending' : anyFailed ? 'Fail' : 'Pass',
      };
    });
  }, [filteredStudents, allSubjects, templatesBySubject, marksLookup]);

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
          <p className="text-sm text-muted-foreground mt-1">Select a class to compile results across all subjects</p>
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

      {/* Teacher Submissions */}
      {teacherCompilations.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Teacher Submissions ({teacherCompilations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Teacher</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Subject</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Grade</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Academic Year</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Students</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Avg %</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Status</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherCompilations.map((comp) => {
                  const avgPercentage = comp.results.length > 0
                    ? comp.results.reduce((sum, r) => sum + r.percentage, 0) / comp.results.length
                    : 0;
                  return (
                    <TableRow key={comp.id} className="hover:bg-muted/20">
                      <TableCell className="border border-border px-3 py-2 text-foreground">{comp.teacher.name}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground">{comp.subject.name}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground">{comp.gradeLevel}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground">{comp.academicYear.name}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center text-foreground">{comp.results.length}</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center text-foreground">{avgPercentage.toFixed(1)}%</TableCell>
                      <TableCell className="border border-border px-3 py-2 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                          comp.status === 'SUBMITTED'
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                        )}>
                          {comp.status}
                        </span>
                      </TableCell>
                      <TableCell className="border border-border px-3 py-2 text-foreground">
                        {comp.submittedAt ? new Date(comp.submittedAt).toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Class Filter */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Select Class</h3>
        <div className="w-full md:w-72">
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
      </div>

      {/* Compiled Results Table — one column per subject */}
      {compiledResults.length > 0 && (
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Compiled Results ({compiledResults.length} students · {allSubjects.length} subjects)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-0 bg-muted/40">Roll No</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-left font-bold text-foreground sticky left-[60px] bg-muted/40">Student Name</TableHead>
                  {allSubjects.map(s => (
                    <TableHead key={s.id} className="border border-border px-3 py-2 text-center font-bold text-foreground">
                      {s.name}
                    </TableHead>
                  ))}
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Overall %</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Grade</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Result</TableHead>
                  <TableHead className="border border-border px-3 py-2 text-center font-bold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compiledResults.map(result => (
                  <TableRow key={result.studentId} className="hover:bg-muted/20">
                    <TableCell className="border border-border px-3 py-2 text-foreground sticky left-0 bg-background">{result.rollNo}</TableCell>
                    <TableCell className="border border-border px-3 py-2 text-foreground sticky left-[60px] bg-background">{result.studentName}</TableCell>
                    {allSubjects.map(s => {
                      const sub = result.subjects[s.name];
                      return (
                        <TableCell key={s.id} className="border border-border px-3 py-2 text-center text-foreground">
                          {sub ? (
                            <span className={cn("font-mono text-xs", !sub.isPassed && sub.subjectName && "text-destructive")}>
                              {sub.percentage}%
                            </span>
                          ) : '-'}
                        </TableCell>
                      );
                    })}
                    <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                      {result.overallPercentage}%
                    </TableCell>
                    <TableCell className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                      {result.overallGrade}
                    </TableCell>
                    <TableCell className={cn(
                      "border border-border px-3 py-2 text-center font-bold",
                      result.result === 'Pass' ? "text-emerald-600 dark:text-emerald-400" :
                      result.result === 'Fail' ? "text-destructive" :
                      "text-muted-foreground"
                    )}>
                      {result.result}
                    </TableCell>
                    <TableCell className="border border-border px-3 py-2 text-center">
                      <button
                        onClick={() => {
                          const studentObj: Student = {
                            id: result.studentId,
                            name: result.studentName,
                            rollNo: result.rollNo,
                            avatar: '',
                            status: 'Active Enrollment',
                            class: selectedClass === 'all' ? (students.find(s => s.id === result.studentId)?.grade ?? '') : selectedClass,
                            attendance: '100%',
                            department: 'General',
                            overallTotal: '',
                            overallPercent: result.overallPercentage,
                            grade: result.overallGrade,
                            resultStatus: result.result === 'Pass' ? 'PROMOTED' : result.result === 'Fail' ? 'FAILED' : 'PENDING',
                            remarks: result.result === 'Pass' ? 'Promoted to next grade.' : 'Failed to clear all subjects.',
                            scores: Object.values(result.subjects).map(sub => ({
                              subject: sub.subjectName,
                              type: 'General',
                              obtained: sub.totalObtained,
                              max: sub.totalFull,
                              pass: sub.isPassed
                            })),
                            dist: {}
                          };
                          setShowTranscriptModal(studentObj);
                        }}
                        className="px-2.5 py-1 bg-[#002045] hover:bg-opacity-95 text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        View Grade Sheet
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <TranscriptModal
        showTranscriptModal={showTranscriptModal}
        setShowTranscriptModal={setShowTranscriptModal}
      />
    </motion.div>
  );
}
