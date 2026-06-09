'use client';

import { useParams } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import TeacherEvaluationsViewTab from '@/components/admin/TeacherEvaluationsViewTab';
import { AnimatePresence } from 'motion/react';

export default function TeacherAllocationsDetailPage() {
  const params = useParams();
  const { allocations, evaluations } = useAcademicContext();
  
  const allocationId = params.id as string;
  const teacher = allocations.find(a => a.id === allocationId);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Teacher not found</h2>
          <p className="text-sm text-slate-500 mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <TeacherEvaluationsViewTab teacher={teacher} evaluations={evaluations} />
    </AnimatePresence>
  );
}
