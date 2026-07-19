'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useSyncedAllocations } from '@/hooks/use-teacher-assignments';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import TeacherEvaluationsViewTab from '@/components/admin/TeacherEvaluationsViewTab';
import { AnimatePresence, motion } from 'motion/react';
import { Allocation, EvaluationPlan } from '@/types/academic';

export default function TeacherAllocationsDetailPage() {
  const params = useParams();
  const allocationId = params.id as string;

  // Fetch all synced teachers with their subjects
  const { data: syncedTeachers = [], isLoading: isTeachersLoading } = useSyncedAllocations();

  // Find this specific teacher
  const syncedTeacher = syncedTeachers.find(t => t.id === allocationId);

  // Fetch all evaluation templates (we'll filter by subject IDs below)
  const { data: templatesData = [], isLoading: isTemplatesLoading } = useEvaluationTemplates(
    {},
    { enabled: !!syncedTeacher }
  );

  // Build the Allocation object for TeacherEvaluationsViewTab
  const allocation: Allocation | undefined = useMemo(() => {
    if (!syncedTeacher) return undefined;
    const uniqueClasses = Array.from(new Set(syncedTeacher.subjects.map(s => s.gradeLevel)));
    const subjectNames = Array.from(new Set(syncedTeacher.subjects.map(s => s.name)));
    return {
      id: syncedTeacher.id,
      teacher: syncedTeacher.name,
      title: `${syncedTeacher.subjects.length} subject${syncedTeacher.subjects.length !== 1 ? 's' : ''} assigned`,
      avatar: syncedTeacher.imageUrl || '',
      email: syncedTeacher.email,
      phone: syncedTeacher.phone,
      imageUrl: syncedTeacher.imageUrl,
      classTeacherId: syncedTeacher.classTeacherId,
      classTeacherClassName: syncedTeacher.classTeacherClassName,
      classes: uniqueClasses,
      subjects: subjectNames,
      status: 'Active',
    };
  }, [syncedTeacher]);

  // Build EvaluationPlan[] by filtering templates to this teacher's subjects
  const evaluations: EvaluationPlan[] = useMemo(() => {
    if (!syncedTeacher || templatesData.length === 0) return [];

    const subjectIdSet = new Set(syncedTeacher.subjects.map(s => s.id));
    const teacherTemplates = templatesData.filter(t => subjectIdSet.has(t.syncedSubjectId));

    // Group by gradeConfigId + syncedSubjectId + evalTitle (same pattern as teacher's evaluations page)
    const groups = new Map<string, typeof teacherTemplates>();
    for (const t of teacherTemplates) {
      const evalTitleMatch = t.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : '__legacy__';
      const evalTitle = rawEvalPart.split('|')[0];
      const key = `${t.gradeConfigId}::${t.syncedSubjectId}::${evalTitle}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    return Array.from(groups.entries()).map(([, group]) => {
      const first = group[0];
      const subjectName = first.syncedSubject?.name ?? 'Unknown';
      const gradeLevel = first.syncedSubject?.gradeLevel ?? first.gradeConfig?.gradeLevel ?? '';
      const evalTitleMatch = first.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : '';
      const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');
      const totalFullMarks = group.reduce((s, t) => s + Number(t.fullMarks), 0);
      const totalPassMarks = group.reduce((s, t) => s + Number(t.passMarks), 0);

      const latestDate = group
        .map(t => (t.scheduledDate ? new Date(t.scheduledDate) : null))
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      // Earliest createdAt in the group = when this plan was first created
      const earliestCreatedAt = group
        .map(t => t.createdAt)
        .filter(Boolean)
        .sort()[0];

      return {
        id: first.id,
        title: evalTitle || subjectName,
        subject: subjectName,
        gradeLevel,
        section: first.syncedSubject?.section ?? undefined,
        status: first.isActive ? 'Active' : 'Inactive',
        testTypes: `${group.length} Task${group.length !== 1 ? 's' : ''}`,
        outcomes: `${group.length} Outcome${group.length !== 1 ? 's' : ''}`,
        fullMarks: totalFullMarks,
        passMarks: totalPassMarks,
        date: latestDate
          ? latestDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'TBD',
        unit: unitTitle,
        learningOutcomes: group.map(t => {
          const newFormat = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
          const legacyFormat = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
          const taskType = newFormat ? newFormat[1] : legacyFormat ? legacyFormat[1] : 'Standard';
          const outcomeName = newFormat ? newFormat[2] : legacyFormat ? legacyFormat[2] : t.name;
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
          };
        }),
        subEvaluations: group.map(t => ({
          id: t.id,
          name: t.name,
          fullMarks: Number(t.fullMarks),
          passMarks: Number(t.passMarks),
          weightage: Number(t.weightage),
          scheduledDate: t.scheduledDate,
        })),
        templateIds: group.map(t => t.id),
        createdAt: earliestCreatedAt,
      } satisfies EvaluationPlan;
    });
  }, [syncedTeacher, templatesData]);

  const isLoading = isTeachersLoading || isTemplatesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-4 bg-muted/60 rounded w-48" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold text-foreground">Teacher not found</h2>
          <p className="text-sm text-muted-foreground mt-2">This teacher may not be synced yet or the URL is incorrect.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <TeacherEvaluationsViewTab teacher={allocation} evaluations={evaluations} />
    </AnimatePresence>
  );
}
