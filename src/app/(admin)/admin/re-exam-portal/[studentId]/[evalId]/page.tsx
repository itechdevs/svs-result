'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useStudents } from '@/hooks/use-students';
import { useEvaluationTemplates } from '@/hooks/use-evaluations';
import ReExamDetailedView from '@/components/admin/ReExamDetailedView';
import { AnimatePresence } from 'motion/react';
import { Student, EvaluationPlan } from '@/types/academic';

export default function ReExamDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const evalId = params.evalId as string;

  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: templatesData = [] } = useEvaluationTemplates();

  const student: Student | undefined = useMemo(() => {
    const s = studentsData?.students.find(s => s.id === studentId);
    if (!s) return undefined;
    return {
      id: s.id, name: s.name, rollNo: s.rollNumber,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
      status: s.isActive ? 'Active' : 'Inactive', class: s.grade,
      attendance: '96%', department: 'Primary', overallTotal: '—',
      overallPercent: 0, grade: '—', resultStatus: 'PENDING', remarks: '', scores: [], dist: {},
    };
  }, [studentsData, studentId]);

  const evaluation: EvaluationPlan | undefined = useMemo(() => {
    const t = templatesData.find(t => t.id === evalId);
    if (!t) return undefined;
    return {
      id: t.id, title: t.name, subject: t.syncedSubject?.name ?? 'Unknown',
      status: t.isActive ? 'Active' : 'Inactive', testTypes: 'Standard', outcomes: '1 Outcomes',
      fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks),
      date: t.scheduledDate ? new Date(t.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'TBD',
      unit: t.name,
      learningOutcomes: [{
        name: t.name, text: `Evaluate outcome competence for ${t.name}.`,
        regularRating: 0, afterSupportRating: null,
        regularDate: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
        supportDate: '', fullMarks: Number(t.fullMarks), passMarks: Number(t.passMarks), taskType: 'Standard',
      }],
    };
  }, [templatesData, evalId]);

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
