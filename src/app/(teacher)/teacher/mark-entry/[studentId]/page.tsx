'use client';

import { useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import { useStudentEvaluationResults, useBulkSaveMarks } from '@/hooks/use-evaluations';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';
import { Student, EvaluationPlan, StudentOutcomeMark, OutcomeMark } from '@/types/academic';
import { useState, useEffect, useCallback } from 'react';

export default function StudentMarkEntryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const evalId = searchParams.get('evalId') ?? '';

  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: resultsData = [] } = useStudentEvaluationResults({
    syncedStudentId: studentId,
    evaluationTemplateId: evalId || undefined,
  });
  const bulkSave = useBulkSaveMarks();

  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark[]>([]);

  // Sync DB results into local state
  useEffect(() => {
    if (resultsData.length === 0) return;
    const outcomeMarks: Record<string, OutcomeMark> = {};
    resultsData.forEach(r => {
      const name = r.evaluationTemplate?.name ?? 'Mark';
      outcomeMarks[name] = {
        regularMark: r.marksObtained,
        regularDate: r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : '',
        supportMark: null, supportDate: '',
        reExamMark: null,
        reExamDate: '',
        remarks: r.remarks ?? '',
      };
    });
    setLocalMarks([{ studentId, evaluationId: evalId, outcomeMarks }]);
  }, [resultsData, studentId, evalId]);

  const getStudentMark = useCallback(
    (sId: string, eId: string) => localMarks.find(m => m.studentId === sId && m.evaluationId === eId),
    [localMarks]
  );

  const updateOutcomeMark = useCallback(
    (sId: string, eId: string, outcomeName: string, patch: Partial<OutcomeMark>) => {
      setLocalMarks(prev => {
        const idx = prev.findIndex(m => m.studentId === sId && m.evaluationId === eId);
        if (idx === -1) {
          return [...prev, {
            studentId: sId, evaluationId: eId,
            outcomeMarks: { [outcomeName]: { regularMark: null, regularDate: '', supportMark: null, supportDate: '', reExamMark: null, reExamDate: '', remarks: '', ...patch } },
          }];
        }
        const updated = [...prev];
        const existing = updated[idx].outcomeMarks[outcomeName] ?? { regularMark: null, regularDate: '', supportMark: null, supportDate: '', reExamMark: null, reExamDate: '', remarks: '' };
        updated[idx] = { ...updated[idx], outcomeMarks: { ...updated[idx].outcomeMarks, [outcomeName]: { ...existing, ...patch } } };
        return updated;
      });
    },
    []
  );

  const student: Student | undefined = useMemo(() => {
    const s = studentsData?.students.find(s => s.id === studentId);
    if (!s) return undefined;
    return {
      id: s.id, name: s.name, rollNo: s.rollNumber,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      status: s.isActive ? 'Active' : 'Inactive', class: s.grade,
      attendance: '96%', department: 'Primary', overallTotal: '—',
      overallPercent: 0, grade: '—', resultStatus: 'PENDING', remarks: '', scores: [], dist: {},
    };
  }, [studentsData, studentId]);

  const evaluation: EvaluationPlan | undefined = useMemo(() => {
    const t = templatesData.find(t => t.id === evalId);
    if (!t) return undefined;
    return {
      id: t.id, title: t.name, subject: t.syncedSubject?.name ?? 'Unknown',
      status: t.isActive ? 'Active' : 'Inactive', testTypes: 'Standard', outcomes: '1 Outcomes',
      fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks),
      date: t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD',
      unit: t.name,
      learningOutcomes: [{
        name: t.name, text: `Evaluate outcome competence for ${t.name}.`,
        regularRating: 0, afterSupportRating: null,
        regularDate: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
        supportDate: '', fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks), taskType: 'Standard',
      }],
    };
  }, [templatesData, evalId]);

  if (!student || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {!student ? `Student "${studentId}" not found.` : `Evaluation "${evalId}" not found.`}
        </p>
      </div>
    );
  }

  return (
    <DetailedMarkEntryView
      student={student}
      evaluation={evaluation}
      getStudentMark={getStudentMark}
      updateOutcomeMark={updateOutcomeMark}
    />
  );
}
