'use client';

import React from 'react';
import { useAcademicContext } from '@/contexts/AcademicContext';
import MarkEntryTab from '@/components/teacher/MarkEntryTab';
import { AnimatePresence } from 'motion/react';

export default function MarkEntryPage() {
  const {
    evaluations,
    students,
    selectedEvaluationId, setSelectedEvaluationId,
    gradingStudentId, setGradingStudentId,
    saveSuccessMessage, setSaveSuccessMessage,
    updateIndividualRating
  } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <MarkEntryTab
        evaluations={evaluations}
        students={students}
        selectedEvaluationId={selectedEvaluationId}
        setSelectedEvaluationId={setSelectedEvaluationId}
        gradingStudentId={gradingStudentId}
        setGradingStudentId={setGradingStudentId}
        saveSuccessMessage={saveSuccessMessage}
        setSaveSuccessMessage={setSaveSuccessMessage}
        updateIndividualRating={updateIndividualRating}
      />
    </AnimatePresence>
  );
}
