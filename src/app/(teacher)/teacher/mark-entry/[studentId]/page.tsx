'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';
import { Student, EvaluationPlan, StudentOutcomeMark, OutcomeMark } from '@/types/academic';

export default function StudentMarkEntryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const evalId = searchParams.get('evalId') ?? '';

  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: templatesData = [] } = useEvaluationTemplates();
  
  // Find the base template
  const baseTemplate = templatesData.find(t => t.id === evalId);
  
  // Find all templates in the same group (same Eval Title)
  const groupTemplates = useMemo(() => {
    if (!baseTemplate) return [];
    
    const newFormatMatch = baseTemplate.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle] = rawEvalPart.split('|');

    return templatesData.filter(t => {
      if (t.gradeConfigId !== baseTemplate.gradeConfigId) return false;
      if (t.syncedSubjectId !== baseTemplate.syncedSubjectId) return false;
      if (evalTitle) return t.name.startsWith(`[${evalTitle}|`) || t.name.startsWith(`[${evalTitle}][`);
      return !t.name.match(/^\[[^\]]+\]\[/); // Fallback for legacy
    });
  }, [baseTemplate, templatesData]);

  const groupTemplateIds = useMemo(() => groupTemplates.map(t => t.id), [groupTemplates]);

  // Fetch results for all templates in the group
  const { data: resultsData = [] } = useStudentEvaluationResults({
    syncedStudentId: studentId,
    limit: 1000
  });

  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark[]>([]);

  // Sync DB results into local state
  useEffect(() => {
    if (resultsData.length === 0 || groupTemplateIds.length === 0) return;
    
    const groupSet = new Set(groupTemplateIds);
    const relevantResults = resultsData.filter(r => groupSet.has(r.evaluationTemplateId));
    
    if (relevantResults.length === 0) return;

    const outcomeMarks: Record<string, OutcomeMark> = {};
    
    relevantResults.forEach(r => {
      // Find the template for this result to get its full name
      const template = groupTemplates.find(t => t.id === r.evaluationTemplateId);
      if (!template) return;
      
      outcomeMarks[template.name] = {
        regularMark: r.marksObtained !== null && r.marksObtained !== undefined ? Number(r.marksObtained) : null,
        regularDate: r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : '',
        supportMark: null, 
        supportDate: '',
        reExamMark: null,
        reExamDate: '',
        remarks: r.remarks ?? '',
      };
    });
    
    setLocalMarks([{ studentId, evaluationId: evalId, outcomeMarks }]);
  }, [resultsData, studentId, evalId, groupTemplateIds, groupTemplates]);

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
    if (!baseTemplate || groupTemplates.length === 0) return undefined;
    
    const newFormatMatch = baseTemplate.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');

    const totalFullMarks = groupTemplates.reduce((s, t) => s + Number(t.fullMarks), 0);
    const totalPassMarks = groupTemplates.reduce((s, t) => s + Number(t.passMarks), 0);

    return {
      id: baseTemplate.id, 
      title: evalTitle || baseTemplate.syncedSubject?.name || baseTemplate.name, 
      subject: baseTemplate.syncedSubject?.name ?? 'Unknown',
      status: baseTemplate.isActive ? 'Active' : 'Inactive', 
      testTypes: `${groupTemplates.length} Task Types`, 
      outcomes: `${groupTemplates.length} Outcomes`,
      fullMarks: totalFullMarks, 
      passMarks: totalPassMarks,
      date: baseTemplate.scheduledDate ? new Date(baseTemplate.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD',
      unit: unitTitle,
      learningOutcomes: groupTemplates.map(t => {
        const newFmt = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFmt = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFmt ? newFmt[1] : (legacyFmt ? legacyFmt[1] : 'Standard');
        const outcomeName = newFmt ? newFmt[2] : (legacyFmt ? legacyFmt[2] : t.name);

        return {
          name: t.name, 
          text: outcomeName,
          regularRating: 0, 
          afterSupportRating: null,
          regularDate: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
          supportDate: '', 
          fullMarks: Number(t.fullMarks), 
          passMarks: Number(t.passMarks), 
          taskType,
          templateId: t.id
        };
      }),
    };
  }, [baseTemplate, groupTemplates]);

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
