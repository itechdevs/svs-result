'use client';

import React from 'react';
import { useAcademicContext } from '@/contexts/AcademicContext';
import ResultCompilationTab from '@/components/admin/ResultCompilationTab';
import { AnimatePresence } from 'motion/react';

export default function ResultCompilationPage() {
  const { handleCompilationComplete } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <ResultCompilationTab
        onCompilationComplete={handleCompilationComplete}
      />
    </AnimatePresence>
  );
}
