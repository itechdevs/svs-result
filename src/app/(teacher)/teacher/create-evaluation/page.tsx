'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';
import { useCreateEvaluationTemplate } from '@/hooks/use-evaluations';
import { useAcademicYears, useGradeConfigs } from '@/hooks/use-academic-config';
import { useSubjects } from '@/hooks/use-subjects';

interface OutcomeRow { name: string; date: string; max: number; pass: number; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

export default function CreateEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';

  const [newEvalTitle, setNewEvalTitle] = useState('Term 1 Assessment');
  const [newEvalSubject, setNewEvalSubject] = useState(selectedSubject || 'Science');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([
    { taskType: 'Written', max: 4, pass: 2, outcomes: [{ name: 'Theory & Principles', date: '', max: 30, pass: 12 }] },
    { taskType: 'Practical Assessment', max: 40, pass: 16, outcomes: [{ name: 'Laboratory Safety & Setup', date: '', max: 25, pass: 10 }] },
  ]);

  const createTemplateMutation = useCreateEvaluationTemplate();
  const { data: academicYears } = useAcademicYears();
  const { data: gradeConfigs } = useGradeConfigs();
  const { data: subjects } = useSubjects();

  const qs = new URLSearchParams();
  if (selectedClass) qs.set('class', selectedClass);
  if (selectedSubject) qs.set('subject', selectedSubject);
  const suffix = qs.toString() ? `?${qs}` : '';

  const setCurrentTab = (tab: string) => {
    if (tab === 'evaluations') router.push(`/teacher/evaluations${suffix}`);
    else if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const handleCreateEvaluation = async () => {
    const currentYear = academicYears?.find(y => y.isCurrent);
    if (!currentYear) { alert('No current academic year defined'); return; }

    const gradeConfig = gradeConfigs?.find(c => c.academicYearId === currentYear.id && c.gradeLevel === selectedClass);
    if (!gradeConfig) { alert(`No grade config found for ${selectedClass}`); return; }

    const subject = subjects?.find(s => s.name === newEvalSubject && s.gradeLevel === selectedClass);
    if (!subject) { alert(`Subject ${newEvalSubject} not found for ${selectedClass}`); return; }

    const flatOutcomes = newOutcomes.flatMap(g => g.outcomes.map(o => ({ ...o, taskType: g.taskType })));
    const weightage = flatOutcomes.length > 0 ? 100 / flatOutcomes.length : 100;

    for (const item of flatOutcomes) {
      await createTemplateMutation.mutateAsync({
        gradeConfigId: gradeConfig.id,
        syncedSubjectId: subject.id,
        name: `[${item.taskType}] ${item.name}`,
        fullMarks: item.max,
        passMarks: item.pass,
        weightage,
        scheduledDate: item.date || undefined,
      });
    }

    const markParams = new URLSearchParams();
    if (selectedClass) markParams.set('class', selectedClass);
    if (selectedSubject) markParams.set('subject', selectedSubject);
    router.push(`/teacher/mark-entry${markParams.toString() ? `?${markParams}` : ''}`);
  };

  return (
    <AnimatePresence mode="wait">
      <CreateEvaluationTab
        newEvalTitle={newEvalTitle}
        setNewEvalTitle={setNewEvalTitle}
        newEvalSubject={newEvalSubject}
        setNewEvalSubject={setNewEvalSubject}
        targetMarks={targetMarks}
        setTargetMarks={setTargetMarks}
        newOutcomes={newOutcomes}
        setNewOutcomes={setNewOutcomes}
        handleCreateEvaluation={handleCreateEvaluation}
        setCurrentTab={setCurrentTab as any}
      />
    </AnimatePresence>
  );
}
