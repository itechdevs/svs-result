'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';

export default function EditEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    newEvalTitle, setNewEvalTitle,
    newEvalSubject, setNewEvalSubject,
    targetMarks, setTargetMarks,
    newOutcomes, setNewOutcomes,
    handleUpdateEvaluation,
    loadEvaluationForEdit,
  } = useAcademicContext();

  useEffect(() => {
    if (params.id) {
      loadEvaluationForEdit(params.id as string);
    }
  }, [params.id]);

  const setCurrentTab = (tab: string) => {
    if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const onHandleUpdate = () => {
    handleUpdateEvaluation();
    setShowSuccess(true);
    setTimeout(() => {
      router.push('/teacher/evaluations');
    }, 1500);
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          ✓ Evaluation updated successfully
        </div>
      )}
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
          handleCreateEvaluation={onHandleUpdate}
          setCurrentTab={setCurrentTab as any}
          isEditMode={true}
        />
      </AnimatePresence>
    </>
  );
}
