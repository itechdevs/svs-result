'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';

export default function CreateEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';

  const {
    newEvalTitle, setNewEvalTitle,
    newEvalSubject, setNewEvalSubject,
    targetMarks, setTargetMarks,
    newOutcomes, setNewOutcomes,
    handleCreateEvaluation,
  } = useAcademicContext();

  // Build query string to carry context forward
  const qs = new URLSearchParams();
  if (selectedClass) qs.set('class', selectedClass);
  if (selectedSubject) qs.set('subject', selectedSubject);
  const suffix = qs.toString() ? `?${qs}` : '';

  const setCurrentTab = (tab: string) => {
    if (tab === 'evaluations') router.push(`/teacher/evaluations${suffix}`);
    else if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const onHandleCreate = () => {
    handleCreateEvaluation();
    // After creating, go to mark-entry pre-filtered to this class/subject
    const markParams = new URLSearchParams();
    if (selectedClass) markParams.set('class', selectedClass);
    if (selectedSubject) markParams.set('subject', selectedSubject);
    const markSuffix = markParams.toString() ? `?${markParams}` : '';
    router.push(`/teacher/mark-entry${markSuffix}`);
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
        handleCreateEvaluation={onHandleCreate}
        setCurrentTab={setCurrentTab as any}
      />
    </AnimatePresence>
  );
}
