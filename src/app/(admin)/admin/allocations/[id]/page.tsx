'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTeacherAssignments } from '@/hooks/use-teacher-assignments';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import TeacherEvaluationsViewTab from '@/components/admin/TeacherEvaluationsViewTab';
import { AnimatePresence } from 'motion/react';
import { Allocation, EvaluationPlan } from '@/types/academic';

export default function TeacherAllocationsDetailPage() {
  const params = useParams();
  const allocationId = params.id as string;

  const { data: assignmentsData = [] } = useTeacherAssignments();
  const { data: templatesData = [] } = useEvaluationTemplates();

  const allocations: Allocation[] = useMemo(() =>
    assignmentsData.map(a => ({
      id: a.id,
      teacher: a.user?.name ?? 'Teacher',
      title: a.user?.email ?? 'Instructor',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
      classes: [a.gradeLevel],
      subjects: [a.academicYear?.name ?? 'Subject'],
      status: 'Active',
    })),
    [assignmentsData]
  );

  const evaluations: EvaluationPlan[] = useMemo(() =>
    templatesData.map(t => ({
      id: t.id,
      title: t.name,
      subject: t.syncedSubject?.name ?? 'Unknown',
      status: t.isActive ? 'Active' : 'Inactive',
      testTypes: 'Standard',
      outcomes: '1 Outcomes',
      fullMarks: Number(t.fullMarks),
      passMarks: Number(t.passMarks),
      date: t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD',
      unit: t.name,
      learningOutcomes: [{
        name: t.name,
        text: `Evaluate outcome competence for ${t.name}.`,
        regularRating: 0,
        afterSupportRating: null,
        regularDate: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
        supportDate: '',
        fullMarks: Number(t.fullMarks),
        passMarks: Number(t.passMarks),
        taskType: 'Standard',
      }],
    })),
    [templatesData]
  );

  const teacher = allocations.find(a => a.id === allocationId);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Teacher not found</h2>
          <p className="text-sm text-slate-500 mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <TeacherEvaluationsViewTab teacher={teacher} evaluations={evaluations} />
    </AnimatePresence>
  );
}
