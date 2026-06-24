'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useCreateTeacherEvaluationPlan } from '@/hooks/use-evaluations';
import { useProfile } from '@/hooks/use-profile';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { toast } from 'sonner';

interface OutcomeRow { name: string; date: string; max: number; pass: number; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

export default function CreateEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';

  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState(selectedSubject || '');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([
    { taskType: '', max: 4, pass: 2, outcomes: [{ name: '', date: '', max: 4, pass: 2 }] },
    { taskType: '', max: 4, pass: 2, outcomes: [{ name: '', date: '', max: 4, pass: 2 }] },
  ]);

  const { data: profile } = useProfile();
  const createPlan = useCreateTeacherEvaluationPlan();

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
    if (!selectedClass) {
      toast.error('Please select a class from the sidebar first');
      return;
    }

    const subject = profile?.syncedTeacher?.subjects.find(
      s => s.name === (newEvalSubject || selectedSubject) && s.gradeLevel === selectedClass
    );
    if (!subject) {
      toast.error(`Subject "${newEvalSubject || selectedSubject}" not found for ${selectedClass}`);
      return;
    }

    const flatOutcomes = newOutcomes.flatMap(g =>
      g.outcomes.map((o, i) => ({ ...o, taskType: g.taskType, displayOrder: i }))
    );
    const weightage = parseFloat((flatOutcomes.length > 0 ? 100 / flatOutcomes.length : 100).toFixed(2));

    const doCreate = async () => {
      for (const [i, item] of flatOutcomes.entries()) {
        // Name format: [EvalTitle|UnitTitle][TaskType] OutcomeName
        await createPlan.mutateAsync({
          syncedSubjectId: subject.id,
          gradeLevel: selectedClass,
          name: `[${newEvalTitle}|${newSubjectTitle}][${item.taskType}] ${item.name}`,
          fullMarks: item.max,
          passMarks: item.pass,
          weightage,
          scheduledDate: item.date ? item.date : undefined,
          displayOrder: i,
        });
      }
    };

    toast.promise(doCreate(), {
      loading: 'Creating evaluation plan…',
      success: () => {
        router.push(`/teacher/evaluations${suffix}`);
        return 'Evaluation created successfully';
      },
      error: (err: any) => {
        const detail = err?.details ? JSON.stringify(err.details) : '';
        return `${err?.message || 'Failed to create evaluation plan'}${detail ? ': ' + detail : ''}`;
      },
    });
  };

  return (
    <AnimatePresence mode="wait">
      <CreateEvaluationTab
        newEvalTitle={newEvalTitle}
        setNewEvalTitle={setNewEvalTitle}
        newEvalSubject={newEvalSubject}
        setNewEvalSubject={setNewEvalSubject}
        newSubjectTitle={newSubjectTitle}
        setNewSubjectTitle={setNewSubjectTitle}
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
