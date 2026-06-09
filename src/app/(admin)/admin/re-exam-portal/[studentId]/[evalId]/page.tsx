'use client';

import { useParams } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import ReExamDetailedView from '@/components/admin/ReExamDetailedView';
import { AnimatePresence } from 'motion/react';

export default function ReExamDetailPage() {
  const params = useParams();
  const { students, evaluations } = useAcademicContext();
  
  const studentId = params.studentId as string;
  const evalId = params.evalId as string;
  
  const student = students.find(s => s.id === studentId);
  const evaluation = evaluations.find(e => e.id === evalId);

  if (!student || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Student or Evaluation not found</h2>
          <p className="text-sm text-slate-500 mt-2">Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <ReExamDetailedView student={student} evaluation={evaluation} />
    </AnimatePresence>
  );
}
