'use client';

import React from 'react';
import { useAcademicContext } from '@/contexts/AcademicContext';
import AllocationsTab from '@/components/admin/AllocationsTab';
import { AnimatePresence } from 'motion/react';

export default function AllocationsPage() {
  const { allocations, toggleTeacherStatus, handleImportSuccess } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <AllocationsTab
        allocations={allocations}
        toggleTeacherStatus={toggleTeacherStatus}
        onImportSuccess={handleImportSuccess}
      />
    </AnimatePresence>
  );
}
