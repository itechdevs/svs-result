'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { useCreateTeacherEvaluationPlan } from '@/hooks/use-evaluations';
import { useProfile } from '@/hooks/use-profile';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';

interface OutcomeRow { name: string; date: string; max: number; pass: number; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

export default function CreateEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';

  const [newEvalTitle, setNewEvalTitle] = useState('Term 1 Assessment');
  const [newEvalSubject, setNewEvalSubject] = useState(selectedSubject || '');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([
    { taskType: 'Written', max: 4, pass: 2, outcomes: [{ name: 'Theory & Principles', date: '', max: 30, pass: 12 }] },
    { taskType: 'Practical Assessment', max: 40, pass: 16, outcomes: [{ name: 'Laboratory Safety & Setup', date: '', max: 25, pass: 10 }] },
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
      alert('Please select a class from the sidebar first');
      return;
    }

    const subject = profile?.syncedTeacher?.subjects.find(
      s => s.name === (newEvalSubject || selectedSubject) && s.gradeLevel === selectedClass
    );
    if (!subject) {
      alert(`Subject "${newEvalSubject || selectedSubject}" not found for ${selectedClass}`);
      return;
    }

    const flatOutcomes = newOutcomes.flatMap(g =>
      g.outcomes.map((o, i) => ({ ...o, taskType: g.taskType, displayOrder: i }))
    );
    const weightage = parseFloat((flatOutcomes.length > 0 ? 100 / flatOutcomes.length : 100).toFixed(2));

    try {
      for (const [i, item] of flatOutcomes.entries()) {
        // Include evalTitle in the name to make each plan's templates uniquely keyed
        await createPlan.mutateAsync({
          syncedSubjectId: subject.id,
          gradeLevel: selectedClass,
          name: `[${newEvalTitle}][${item.taskType}] ${item.name}`,
          fullMarks: item.max,
          passMarks: item.pass,
          weightage,
          scheduledDate: item.date ? item.date : undefined,
          displayOrder: i,
        });
      }
    } catch (err: any) {
      const detail = err.details ? JSON.stringify(err.details) : '';
      alert(`${err.message || 'Failed to create evaluation plan'}${detail ? `\n${detail}` : ''}`);
      return;
    }

    // Redirect back to evaluations list so the new card is immediately visible
    router.push(`/teacher/evaluations${suffix}`);
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
