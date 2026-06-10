'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import { useReExamSchedules } from '@/hooks/use-re-exams';
import DashboardTab from './DashboardTab';
import { EvaluationPlan, ReExam } from '@/types/academic';

export default function DashboardWrapper({ role }: { role: string }) {
  const router = useRouter();
  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: reExamData = [] } = useReExamSchedules();
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');

  const evaluations: EvaluationPlan[] = useMemo(() =>
    templatesData.map(t => ({
      id: t.id, title: t.name, subject: t.syncedSubject?.name ?? 'Unknown',
      status: t.isActive ? 'Active' : 'Inactive', testTypes: 'Standard', outcomes: '1 Outcomes',
      fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks),
      date: t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString() : 'TBD',
      unit: t.name, learningOutcomes: [],
    })), [templatesData]);

  const reExams: ReExam[] = useMemo(() =>
    reExamData.map(s => ({
      id: s.id, name: s.evaluationTemplate?.name ?? 'Re-Exam', roll: '',
      subject: s.evaluationTemplate?.syncedSubject?.name ?? '',
      outcome: s.evaluationTemplate?.name ?? '', prevMarks: 'Fail',
      passMarks: Number(s.passMarks), status: s.status,
      color: s.status === 'SCHEDULED' ? 'orange' : 'green',
      date: new Date(s.scheduledDate).toLocaleDateString(), learningOutcomes: [],
    })), [reExamData]);

  const setCurrentTab = (tab: string) => router.push(`/${role}/${tab}`);

  return (
    <DashboardTab
      evaluations={evaluations}
      reExams={reExams}
      setSelectedEvaluationId={setSelectedEvaluationId}
      setCurrentTab={setCurrentTab as any}
      setSchedulingReExam={() => {}}
      setIsLockedSchedule={() => {}}
    />
  );
}
