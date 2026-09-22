'use client';

import { useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';
import { Student, EvaluationPlan } from '@/types/academic';
import { useMarksContext } from '@/contexts/marks-context';
import {
  findGroupSiblings,
  parseEvaluationName,
} from '@/lib/evaluation-grouping';
import SanskarLoader from '@/components/shared/SanskarLoader';

export default function AdminStudentMarkEntryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const evalId = searchParams.get('evalId') ?? '';

  // Build a combined class filter (e.g. "Penguin - B") the same way the overview page does
  const classParam = searchParams.get('class') ?? '';
  const sectionParam = searchParams.get('section') ?? '';
  const studentClassFilter = sectionParam
    ? `${classParam} - ${sectionParam}`
    : classParam;

  const { data: studentsData, isLoading: isStudentsLoading } = useStudents(
    studentId === 'all' && studentClassFilter
      ? { class: studentClassFilter, limit: 9999 }
      : { limit: 500 },
  );
  const { data: templatesData = [], isLoading: isTemplatesLoading } = useEvaluationTemplates();

  const { getStudentMark, updateOutcomeMark, setEvaluations, handleSaveAll } = useMarksContext();

  const isLoading = isStudentsLoading || isTemplatesLoading;

  const baseTemplate = templatesData.find((t) => t.id === evalId);

  const groupTemplates = useMemo(() => {
    if (!baseTemplate) return [];
    return findGroupSiblings(baseTemplate, templatesData);
  }, [baseTemplate, templatesData]);

  useEffect(() => {
    if (groupTemplates.length > 0) setEvaluations(groupTemplates);
  }, [groupTemplates, setEvaluations]);

  const studentsToRender: Student[] = useMemo(() => {
    if (!studentsData?.students) return [];
    let list = studentsData.students;
    if (studentId !== 'all') {
      list = list.filter((s) => s.id === studentId);
    } else {
      if (studentClassFilter) {
        list = list.filter((s) => s.class === studentClassFilter);
      }
    }
    return list.map((s) => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNumber,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
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
  }, [studentsData, studentId, studentClassFilter]);

  const evaluation: EvaluationPlan | undefined = useMemo(() => {
    if (!baseTemplate || groupTemplates.length === 0) return undefined;
    const { evalTitle, unitTitle } = parseEvaluationName(baseTemplate.name);
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
      date: baseTemplate.scheduledDate
        ? new Date(baseTemplate.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        : 'TBD',
      unit: unitTitle,
      learningOutcomes: groupTemplates.map((t) => {
        const newFmt = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFmt = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFmt ? newFmt[1] : legacyFmt ? legacyFmt[1] : 'Standard';
        const outcomeName = newFmt ? newFmt[2] : legacyFmt ? legacyFmt[2] : t.name;
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
  }, [baseTemplate, groupTemplates]);

  if (isLoading) return <SanskarLoader variant="skeleton" />;

  if (studentsToRender.length === 0 || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {studentsToRender.length === 0 ? 'Students not found.' : `Evaluation "${evalId}" not found.`}
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
          readOnly
        />
      ))}
    </div>
  );
}
