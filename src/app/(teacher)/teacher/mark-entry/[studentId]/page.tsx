'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useAcademicContext } from '@/contexts/AcademicContext';
import DetailedMarkEntryView from '@/components/teacher/DetailedMarkEntryView';

export default function StudentMarkEntryPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const searchParams = useSearchParams();
  const evalId = searchParams.get('evalId');

  const { students, evaluations } = useAcademicContext();

  const student = students.find(s => s.id === studentId);
  const evaluation = evaluations.find(e => e.id === evalId);

  if (!student || !evaluation) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {!student ? `Student "${studentId}" not found.` : `Evaluation "${evalId}" not found.`}
        </p>
      </div>
    );
  }

  return <DetailedMarkEntryView student={student} evaluation={evaluation} />;
}
