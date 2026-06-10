'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';
import { useEvaluationTemplate, useUpdateEvaluationTemplate } from '@/hooks/use-evaluations';

interface OutcomeRow { name: string; date: string; max: number; pass: number; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

export default function EditEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';
  const backUrl = `/teacher/evaluations${selectedClass || selectedSubject ? `?${new URLSearchParams({ ...(selectedClass && { class: selectedClass }), ...(selectedSubject && { subject: selectedSubject }) })}` : ''}`;

  const { data: template } = useEvaluationTemplate(id);
  const updateMutation = useUpdateEvaluationTemplate(id);

  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([]);

  // Populate form when template loads
  useEffect(() => {
    if (!template) return;
    setNewEvalTitle(template.name);
    setNewEvalSubject(template.syncedSubject?.name ?? '');
    setTargetMarks(Number(template.fullMarks));
    const match = template.name.match(/^\[(.*?)\]\s*(.*)$/);
    const taskType = match ? match[1] : 'Written';
    const outcomeName = match ? match[2] : template.name;
    setNewOutcomes([{
      taskType,
      max: Number(template.fullMarks),
      pass: Number(template.passMarks),
      outcomes: [{ name: outcomeName, date: template.scheduledDate ?? '', max: Number(template.fullMarks), pass: Number(template.passMarks) }],
    }]);
  }, [template]);

  const setCurrentTab = (tab: string) => {
    if (tab === 'evaluations') router.push(backUrl);
    else if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const handleUpdate = async () => {
    const firstOutcome = newOutcomes[0]?.outcomes[0];
    if (!firstOutcome) return;
    await updateMutation.mutateAsync({
      name: `[${newOutcomes[0].taskType}] ${firstOutcome.name}`,
      fullMarks: firstOutcome.max,
      passMarks: firstOutcome.pass,
      scheduledDate: firstOutcome.date || undefined,
    });
    setShowSuccess(true);
    setTimeout(() => router.push(backUrl), 1500);
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
          handleCreateEvaluation={handleUpdate}
          setCurrentTab={setCurrentTab as any}
          isEditMode={true}
        />
      </AnimatePresence>
    </>
  );
}
