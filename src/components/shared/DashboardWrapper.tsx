'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import DashboardTab from './DashboardTab';

export default function DashboardWrapper({ role }: { role: string }) {
  const router = useRouter();
  const {
    evaluations,
    reExams,
    setSelectedEvaluationId,
    setSchedulingReExam,
    setIsLockedSchedule
  } = useAcademicContext();

  const setCurrentTab = (tab: string) => {
    if (tab === 'dashboard') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${tab}`);
    }
  };

  return (
    <div className="w-full">
      <DashboardTab
        evaluations={evaluations}
        reExams={reExams}
        setSelectedEvaluationId={setSelectedEvaluationId}
        setCurrentTab={setCurrentTab as any}
        setSchedulingReExam={setSchedulingReExam}
        setIsLockedSchedule={setIsLockedSchedule}
      />
    </div>
  );
}
