'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Eye, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useProfile } from '@/hooks/use-profile';
import { useSubjects } from '@/hooks/use-subjects';
import { useEvaluationTemplates, useStudentEvaluationResults, useBulkSaveMarks } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { calcObtainedMarks, calcFullMarks, calcPassFail } from '@/components/teacher/DetailedMarkEntryView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSearchParams } from 'next/navigation';
import { StudentOutcomeMark, OutcomeMark } from '@/types/academic';

export default function MarkEntryOverviewTable() {
  const { data: profile } = useProfile();
  const { data: subjectsData = [] } = useSubjects();
  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: studentsData } = useStudents({ limit: 500 });
  const bulkSave = useBulkSaveMarks();

  const searchParams = useSearchParams();
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') ?? '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') ?? '');
  const [saved, setSaved] = useState(false);
  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark[]>([]);

  // Assigned classes
  const assignedClasses = useMemo(() => {
    if (!profile?.teacherAssignments) return [];
    return Array.from(new Set(profile.teacherAssignments.map(a => a.gradeLevel)));
  }, [profile]);

  // Subjects for selected class
  const subjects = useMemo(() => {
    if (!selectedClass || !profile?.teacherAssignments) return [];
    const classAssignments = profile.teacherAssignments.filter(a => a.gradeLevel === selectedClass);
    const hasAllSubjects = classAssignments.some(a => a.syncedSubjectId === null);
    const classSubjects = subjectsData.filter(s => s.gradeLevel === selectedClass);
    if (hasAllSubjects) return classSubjects.map(s => s.name);
    const ids = new Set(classAssignments.map(a => a.syncedSubjectId));
    return classSubjects.filter(s => ids.has(s.id)).map(s => s.name);
  }, [selectedClass, profile, subjectsData]);

  // Evaluation template for class+subject
  const evaluation = useMemo(() => {
    if (!selectedClass || !selectedSubject) return undefined;
    const subject = subjectsData.find(s => s.name === selectedSubject && s.gradeLevel === selectedClass);
    if (!subject) return undefined;
    const t = templatesData.find(t => t.syncedSubjectId === subject.id);
    if (!t) return undefined;
    return {
      id: t.id, title: t.name, subject: t.syncedSubject?.name ?? 'Unknown',
      learningOutcomes: [{
        name: t.name, text: '', regularRating: 0, afterSupportRating: null,
        regularDate: '', supportDate: '',
        fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks), taskType: 'Standard',
      }],
      fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks),
    };
  }, [selectedClass, selectedSubject, subjectsData, templatesData]);

  // Students for selected class
  const classStudents = useMemo(() =>
    studentsData?.students.filter(s => s.grade === selectedClass) ?? [],
    [studentsData, selectedClass]
  );

  // Fetch results for this evaluation
  const { data: resultsData = [] } = useStudentEvaluationResults(
    evaluation ? { evaluationTemplateId: evaluation.id, limit: 1000 } : {}
  );

  // Sync DB results into local marks once
  useEffect(() => {
    if (!evaluation || resultsData.length === 0) return;
    const mapped: StudentOutcomeMark[] = resultsData.map(r => ({
      studentId: r.syncedStudentId,
      evaluationId: r.evaluationTemplateId,
      outcomeMarks: {
        [evaluation.learningOutcomes[0].name]: {
          regularMark: r.marksObtained,
          regularDate: r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : '',
          supportMark: null, supportDate: '', reExamMark: null, reExamDate: '', remarks: r.remarks ?? '',
        },
      },
    }));
    setLocalMarks(mapped);
  }, [resultsData, evaluation?.id]);

  const getStudentMark = useCallback(
    (studentId: string, evalId: string) => localMarks.find(m => m.studentId === studentId && m.evaluationId === evalId),
    [localMarks]
  );

  const updateOutcomeMark = useCallback(
    (studentId: string, evalId: string, outcomeName: string, patch: Partial<OutcomeMark>) => {
      setLocalMarks(prev => {
        const idx = prev.findIndex(m => m.studentId === studentId && m.evaluationId === evalId);
        if (idx === -1) {
          return [...prev, { studentId, evaluationId: evalId, outcomeMarks: { [outcomeName]: { regularMark: null, regularDate: '', supportMark: null, supportDate: '', reExamMark: null, reExamDate: '', remarks: '', ...patch } } }];
        }
        const updated = [...prev];
        const existing = updated[idx].outcomeMarks[outcomeName] ?? { regularMark: null, regularDate: '', supportMark: null, supportDate: '', reExamMark: null, reExamDate: '', remarks: '' };
        updated[idx] = { ...updated[idx], outcomeMarks: { ...updated[idx].outcomeMarks, [outcomeName]: { ...existing, ...patch } } };
        return updated;
      });
    }, []
  );

  const handleSaveAll = async () => {
    if (!evaluation) return;
    const relevantMarks = localMarks.filter(m => m.evaluationId === evaluation.id);
    if (relevantMarks.length === 0) return;
    const outcomeKey = evaluation.learningOutcomes[0].name;
    await bulkSave.mutateAsync({
      evaluationTemplateId: evaluation.id,
      results: relevantMarks.map(m => ({
        syncedStudentId: m.studentId,
        marksObtained: m.outcomeMarks[outcomeKey]?.regularMark ?? undefined,
        isAbsent: m.outcomeMarks[outcomeKey]?.regularMark === null || m.outcomeMarks[outcomeKey]?.regularMark === undefined,
        remarks: m.outcomeMarks[outcomeKey]?.remarks || undefined,
      })),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleMarkChange = (studentId: string, outcomeName: string, raw: string, max: number) => {
    if (!evaluation) return;
    const num = raw === '' ? null : Math.min(Math.max(0, Number(raw)), max);
    updateOutcomeMark(studentId, evaluation.id, outcomeName, { regularMark: num });
  };

  const handleClassChange = (value: string) => { setSelectedClass(value); setSelectedSubject(''); };
  const outcomes = evaluation?.learningOutcomes ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <h1 className="text-lg font-bold text-foreground mb-4">Mark Entry</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Class</label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select a class..." /></SelectTrigger>
              <SelectContent>
                {assignedClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
              <SelectTrigger className="w-full text-sm"><SelectValue placeholder={selectedClass ? 'Select a subject...' : 'Select a class first'} /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {(!selectedClass || !selectedSubject) && (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Select a class and subject to view the mark entry table.</p>
        </div>
      )}

      {selectedClass && selectedSubject && !evaluation && (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No evaluation plan found for <strong>{selectedSubject}</strong> in <strong>{selectedClass}</strong>.
          </p>
        </div>
      )}

      {evaluation && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <p className="font-bold text-sm text-foreground">{evaluation.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{selectedClass} · {selectedSubject} · {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</p>
            </div>
            <Button onClick={handleSaveAll} className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90">
              Save All
            </Button>
          </div>

          {classStudents.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No students found in {selectedClass}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b border-border">
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Roll No</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Student Name</TableHead>
                  {outcomes.map(lo => (
                    <TableHead key={lo.name} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center whitespace-nowrap">
                      <div>{lo.name}</div>
                      <div className="text-[9px] font-normal text-muted-foreground normal-case font-mono">/{lo.fullMarks ?? '—'} · pass {lo.passMarks ?? '—'}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center whitespace-nowrap">Total</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Result</TableHead>
                  <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents.map(student => {
                  const marks = getStudentMark(student.id, evaluation.id);
                  const obtained = calcObtainedMarks(marks, outcomes);
                  const fullTotal = calcFullMarks(outcomes);
                  const status = calcPassFail(marks, outcomes);
                  return (
                    <TableRow key={student.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground whitespace-nowrap">{student.rollNumber}</TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">{student.name}</TableCell>
                      {outcomes.map(lo => {
                        const val = marks?.outcomeMarks[lo.name]?.regularMark;
                        const max = lo.fullMarks ?? 100;
                        const isFail = val !== null && val !== undefined && val < (lo.passMarks ?? 0);
                        return (
                          <TableCell key={lo.name} className="text-center">
                            <Input type="number" min={0} max={max} step="any" value={val ?? ''} placeholder="—"
                              onChange={e => handleMarkChange(student.id, lo.name, e.target.value, max)}
                              className={cn('w-16 text-center text-xs font-bold mx-auto border-2',
                                isFail ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-900 dark:text-red-300'
                                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                              )} />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold text-sm text-foreground whitespace-nowrap">{obtained} / {fullTotal}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase',
                          status === 'Pass' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : status === 'Fail' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                              : 'bg-muted text-muted-foreground'
                        )}>{status}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/teacher/mark-entry/${student.id}?evalId=${evaluation.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <Eye className="w-3 h-3" />View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle className="w-5 h-5" />Marks saved successfully!
        </motion.div>
      )}
    </motion.div>
  );
}
