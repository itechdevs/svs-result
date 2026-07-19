'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';
import { Student, EvaluationPlan } from '@/types/academic';
import { useMarksContext } from '@/contexts/marks-context';
import { CheckCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

import SanskarLoader from '@/components/shared/SanskarLoader';

export default function StudentMarkEntryPage() {
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isLoading = isStudentsLoading || isTemplatesLoading;

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
      if (studentClassFilter) {
        list = list.filter((s) => s.class === studentClassFilter);
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
  }, [studentsData, studentId, studentClassFilter]);

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

  if (isLoading) {
    return <SanskarLoader variant="skeleton" />;
  }

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
    <div className="space-y-12 pb-20 relative">
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
      {studentId === 'all' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-card/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-border shadow-md">
          <p className="text-sm font-semibold text-foreground">
            {studentsToRender.length} student{studentsToRender.length !== 1 ? 's' : ''} · {evaluation?.subject} · {evaluation?.title}
          </p>
          <button
            onClick={async () => {
              setSaveStatus('saving');
              try {
                await handleSaveAll();
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2500);
              } catch {
                setSaveStatus('idle');
              }
            }}
            disabled={saveStatus === 'saving'}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors border',
              saveStatus === 'saved'
                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : saveStatus === 'saving'
                  ? 'opacity-60 cursor-not-allowed bg-muted text-muted-foreground border-border'
                  : 'bg-primary text-primary-foreground border-primary hover:bg-primary/90',
            )}
          >
            {saveStatus === 'saved' ? (
              <><CheckCircle className="w-3.5 h-3.5" /> All Saved</>
            ) : saveStatus === 'saving' ? (
              <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Saving All...</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save All</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
