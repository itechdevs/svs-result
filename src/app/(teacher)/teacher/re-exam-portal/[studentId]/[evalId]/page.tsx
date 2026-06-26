'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import ReExamDetailedView from '@/components/admin/ReExamDetailedView';
import { AnimatePresence } from 'motion/react';
import { Student, EvaluationPlan } from '@/types/academic';
import SanskarLoader from '@/components/shared/SanskarLoader';

export default function TeacherReExamDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const evalId = params.evalId as string;

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents({ limit: 500 });
  const { data: templatesData = [], isLoading: isTemplatesLoading } = useEvaluationTemplates();

  const isLoading = isStudentsLoading || isTemplatesLoading;

  const student: Student | undefined = useMemo(() => {
    const s = studentsData?.students.find(s => s.id === studentId);
    if (!s) return undefined;
    return {
      id: s.id, name: s.name, rollNo: s.rollNumber,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      status: s.isActive ? 'Active' : 'Inactive', class: s.class,
      attendance: '96%', department: 'Primary', overallTotal: '—',
      overallPercent: 0, grade: '—', resultStatus: 'PENDING', remarks: '', scores: [], dist: {},
    };
  }, [studentsData, studentId]);

  const evaluation: EvaluationPlan | undefined = useMemo(() => {
    const baseTemplate = templatesData.find(t => t.id === evalId);
    if (!baseTemplate) return undefined;

    const newFormatMatch = baseTemplate.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');

    const group = templatesData.filter(t => {
      if (t.gradeConfigId !== baseTemplate.gradeConfigId) return false;
      if (t.syncedSubjectId !== baseTemplate.syncedSubjectId) return false;
      if (evalTitle) return t.name.startsWith(`[${evalTitle}|`) || t.name.startsWith(`[${evalTitle}][`);
      return !t.name.match(/^\[[^\]]+\]\[/);
    });

    const resolvedGroup = group.length > 0 ? group : [baseTemplate];
    const totalFullMarks = resolvedGroup.reduce((s, t) => s + Number(t.fullMarks), 0);
    const totalPassMarks = resolvedGroup.reduce((s, t) => s + Number(t.passMarks), 0);

    return {
      id: baseTemplate.id,
      title: evalTitle || baseTemplate.syncedSubject?.name || baseTemplate.name,
      subject: baseTemplate.syncedSubject?.name ?? 'Unknown',
      status: baseTemplate.isActive ? 'Active' : 'Inactive',
      testTypes: `${resolvedGroup.length} Task Types`,
      outcomes: `${resolvedGroup.length} Outcomes`,
      fullMarks: totalFullMarks,
      passMarks: totalPassMarks,
      date: baseTemplate.scheduledDate
        ? new Date(baseTemplate.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : 'TBD',
      unit: unitTitle,
      learningOutcomes: resolvedGroup.map(t => {
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
          templateId: t.id,
        };
      }),
    };
  }, [templatesData, evalId]);

  if (isLoading) return <SanskarLoader variant="skeleton" />;

  if (!student || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Student or Evaluation not found</h2>
          <p className="text-sm text-slate-500 mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <ReExamDetailedView student={student} evaluation={evaluation} backHref="/teacher/re-exam-portal" />
    </AnimatePresence>
  );
}
