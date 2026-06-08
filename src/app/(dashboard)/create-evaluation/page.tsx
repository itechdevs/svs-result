'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';

export default function CreateEvaluationPage() {
  const router = useRouter();
  const {
    newEvalTitle, setNewEvalTitle,
    newEvalSubject, setNewEvalSubject,
    targetMarks, setTargetMarks,
    newOutcomes, setNewOutcomes,
    handleCreateEvaluation,
  } = useAcademicContext();

  const setCurrentTab = (tab: string) => {
    if (tab === 'dashboard') router.push('/dashboard');
    else router.push(`/dashboard/${tab}`);
  };

  const onHandleCreate = () => {
    handleCreateEvaluation();
    router.push('/dashboard/evaluations');
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
