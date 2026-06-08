'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import EvaluationsTab from '@/components/teacher/EvaluationsTab';
import { motion, AnimatePresence } from 'motion/react';

export default function EvaluationsPage() {
  const router = useRouter();
  const {
    evaluations,
    setSelectedEvaluationId,
    setNewEvalTitle,
    setNewEvalSubject,
    newEvalSubject,
  } = useAcademicContext();

  const setCurrentTab = (tab: string) => {
    if (tab === 'dashboard') router.push('/dashboard');
    else router.push(`/dashboard/${tab}`);
  };

  return (
    <AnimatePresence mode="wait">
      <EvaluationsTab
        evaluations={evaluations}
        setSelectedEvaluationId={setSelectedEvaluationId}
        setCurrentTab={setCurrentTab as any}
        setNewEvalTitle={setNewEvalTitle}
        setNewEvalSubject={setNewEvalSubject}
        newEvalSubject={newEvalSubject}
      />
    </AnimatePresence>
  );
}
