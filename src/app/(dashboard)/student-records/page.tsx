'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import StudentRecordsTab from '@/components/admin/StudentRecordsTab';
import TranscriptModal from '@/components/shared/TranscriptModal';
import { AnimatePresence } from 'motion/react';

export default function StudentRecordsPage() {
  const router = useRouter();
  const {
    students,
    gradingStudentId, setGradingStudentId,
    setShowTranscriptModal, showTranscriptModal
  } = useAcademicContext();

  const setCurrentTab = (tab: string) => {
    if (tab === 'dashboard') router.push('/');
    else router.push(`/${tab}`);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <StudentRecordsTab
          students={students}
          gradingStudentId={gradingStudentId}
          setGradingStudentId={setGradingStudentId}
          setCurrentTab={setCurrentTab as any}
          setShowTranscriptModal={setShowTranscriptModal}
          role="admin" // role is typically grabbed from session, but for now hardcode as in Canvas or grab from session if needed
        />
      </AnimatePresence>
      <TranscriptModal
        showTranscriptModal={showTranscriptModal}
        setShowTranscriptModal={setShowTranscriptModal}
      />
    </>
  );
}
