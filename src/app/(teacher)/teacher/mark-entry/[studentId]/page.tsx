'use client';

import { useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';
import { Student, EvaluationPlan } from '@/types/academic';
import { useMarksContext } from '@/contexts/marks-context';

export default function StudentMarkEntryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const evalId = searchParams.get('evalId') ?? '';

  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: templatesData = [] } = useEvaluationTemplates();

  // Pull shared marks state from context (same instance as MarkEntryOverviewTable)
  const { getStudentMark, updateOutcomeMark, setEvaluations, handleSaveAll } = useMarksContext();

  // Find the base template clicked from the overview
  const baseTemplate = templatesData.find((t) => t.id === evalId);

  // Find all templates in the same evaluation group
  const groupTemplates = useMemo(() => {
    if (!baseTemplate) return [];

    const newFormatMatch = baseTemplate.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle] = rawEvalPart.split('|');

    return templatesData.filter((t) => {
      if (t.gradeConfigId !== baseTemplate.gradeConfigId) return false;
      if (t.syncedSubjectId !== baseTemplate.syncedSubjectId) return false;
      if (evalTitle)
        return (
          t.name.startsWith(`[${evalTitle}|`) ||
          t.name.startsWith(`[${evalTitle}][`)
        );
      return !t.name.match(/^\[[^\]]+\]\[/);
    });
  }, [baseTemplate, templatesData]);

  // Sync group templates into the shared context so DB results are fetched
  // This ensures that if the user navigates DIRECTLY to this page (without going through overview),
  // the context still hydrates correctly.
  useEffect(() => {
    if (groupTemplates.length > 0) {
      setEvaluations(groupTemplates);
    }
  }, [groupTemplates, setEvaluations]);

  // Build Student shapes
  const studentsToRender: Student[] = useMemo(() => {
    if (!studentsData?.students) return [];
    
    let list = studentsData.students;
    if (studentId !== 'all') {
      list = list.filter((s) => s.id === studentId);
    } else {
      const className = searchParams.get('class');
      if (className) {
        list = list.filter((s) => s.class === className);
      }
    }

    return list.map((s) => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNumber,
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      status: s.isActive ? 'Active' : 'Inactive',
      class: s.class,
      attendance: '96%',
      department: 'Primary',
      overallTotal: '—',
      overallPercent: 0,
      grade: '—',
      resultStatus: 'PENDING',
      remarks: '',
      scores: [],
      dist: {},
    }));
  }, [studentsData, studentId, searchParams]);

  // Build EvaluationPlan shape from group templates
  const evaluation: EvaluationPlan | undefined = useMemo(() => {
    if (!baseTemplate || groupTemplates.length === 0) return undefined;

    const newFormatMatch = baseTemplate.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');

    const totalFullMarks = groupTemplates.reduce(
      (s, t) => s + Number(t.fullMarks),
      0
    );
    const totalPassMarks = groupTemplates.reduce(
      (s, t) => s + Number(t.passMarks),
      0
    );

    return {
      id: baseTemplate.id,
      title: evalTitle || baseTemplate.syncedSubject?.name || baseTemplate.name,
      subject: baseTemplate.syncedSubject?.name ?? 'Unknown',
      status: baseTemplate.isActive ? 'Active' : 'Inactive',
      testTypes: `${groupTemplates.length} Task Types`,
      outcomes: `${groupTemplates.length} Outcomes`,
      fullMarks: totalFullMarks,
      passMarks: totalPassMarks,
      date: baseTemplate.scheduledDate
        ? new Date(baseTemplate.scheduledDate).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })
        : 'TBD',
      unit: unitTitle,
      learningOutcomes: groupTemplates.map((t) => {
        const newFmt = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFmt = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFmt
          ? newFmt[1]
          : legacyFmt
          ? legacyFmt[1]
          : 'Standard';
        const outcomeName = newFmt
          ? newFmt[2]
          : legacyFmt
          ? legacyFmt[2]
          : t.name;

        return {
          name: t.name,
          text: outcomeName,
          regularRating: 0,
          afterSupportRating: null,
          regularDate: t.scheduledDate
            ? new Date(t.scheduledDate).toISOString().split('T')[0]
            : '',
          supportDate: '',
          fullMarks: Number(t.fullMarks),
          passMarks: Number(t.passMarks),
          taskType,
          templateId: t.id,
        };
      }),
    };
  }, [baseTemplate, groupTemplates]);

  if (studentsToRender.length === 0 || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {studentsToRender.length === 0
            ? `Students not found.`
            : `Evaluation "${evalId}" not found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {studentsToRender.map((student) => (
        <DetailedMarkEntryView
          key={student.id}
          student={student}
          evaluation={evaluation}
          getStudentMark={getStudentMark}
          updateOutcomeMark={updateOutcomeMark}
          handleSaveAll={handleSaveAll}
        />
      ))}
    </div>
  );
}
