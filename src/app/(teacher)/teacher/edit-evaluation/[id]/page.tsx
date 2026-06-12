'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';
import { useEvaluationTemplate, useEvaluationTemplates } from '@/hooks/use-evaluations';
import { useUpdateEvaluationTemplate } from '@/hooks/use-evaluations';
import { apiClient } from '@/lib/api-client';

interface OutcomeRow { name: string; date: string; max: number; pass: number; templateId?: string; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

export default function EditEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';
  const backUrl = `/teacher/evaluations${selectedClass || selectedSubject
    ? `?${new URLSearchParams({ ...(selectedClass && { class: selectedClass }), ...(selectedSubject && { subject: selectedSubject }) })}`
    : ''}`;

  const { data: template } = useEvaluationTemplate(id);
  const { data: allTemplates = [] } = useEvaluationTemplates();

  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState('');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([]);

  useEffect(() => {
    if (!template || allTemplates.length === 0) return;

    // Extract the eval title from the clicked template's name
    const newFormatMatch = template.name.match(/^\[([^\]]+)\]\[/);
    const evalTitle = newFormatMatch ? newFormatMatch[1] : '';

    // Find all siblings: same gradeConfigId + syncedSubjectId + evalTitle
    const group = allTemplates.filter(t => {
      if (t.gradeConfigId !== template.gradeConfigId) return false;
      if (t.syncedSubjectId !== template.syncedSubjectId) return false;
      if (evalTitle) {
        return t.name.startsWith(`[${evalTitle}][`);
      }
      // Legacy format: same gradeConfig+subject, no [EvalTitle][ prefix
      return !t.name.match(/^\[[^\]]+\]\[/);
    });

    const resolvedGroup = group.length > 0 ? group : [template];

    setNewEvalTitle(evalTitle || template.syncedSubject?.name || template.name);
    setNewEvalSubject(template.syncedSubject?.name ?? '');
    setTargetMarks(resolvedGroup.reduce((s, t) => s + Number(t.fullMarks), 0));

    // Rebuild task groups, preserving templateId per outcome for targeted updates
    const taskGroupMap = new Map<string, TaskGroup>();
    for (const t of resolvedGroup) {
      const newFmt = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
      const legacyFmt = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
      const taskType = newFmt ? newFmt[1] : (legacyFmt ? legacyFmt[1] : 'Written');
      const outcomeName = newFmt ? newFmt[2] : (legacyFmt ? legacyFmt[2] : t.name);

      if (!taskGroupMap.has(taskType)) {
        taskGroupMap.set(taskType, { taskType, max: 0, pass: 0, outcomes: [] });
      }
      const tg = taskGroupMap.get(taskType)!;
      tg.outcomes.push({
        name: outcomeName,
        date: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
        max: Number(t.fullMarks),
        pass: Number(t.passMarks),
        templateId: t.id,
      });
      tg.max += Number(t.fullMarks);
      tg.pass += Number(t.passMarks);
    }

    setNewOutcomes(Array.from(taskGroupMap.values()));
  }, [template, allTemplates]);

  const setCurrentTab = (tab: string) => {
    if (tab === 'evaluations') router.push(backUrl);
    else if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const handleUpdate = async () => {
    try {
      for (const tg of newOutcomes) {
        for (const outcome of tg.outcomes) {
          if (!outcome.templateId) continue;
          const newName = `[${newEvalTitle}][${tg.taskType}] ${outcome.name}`;
          await apiClient.patch(`/admin/evaluation-templates/${outcome.templateId}`, {
            name: newName,
            fullMarks: outcome.max,
            passMarks: outcome.pass,
            scheduledDate: outcome.date || undefined,
          });
        }
      }
      setShowSuccess(true);
      setTimeout(() => router.push(backUrl), 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to update evaluation');
    }
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
          newSubjectTitle={newSubjectTitle}
          setNewSubjectTitle={setNewSubjectTitle}
          targetMarks={targetMarks}
          setTargetMarks={setTargetMarks}
          newOutcomes={newOutcomes}
          setNewOutcomes={setNewOutcomes as any}
          handleCreateEvaluation={handleUpdate}
          setCurrentTab={setCurrentTab as any}
          isEditMode={true}
        />
      </AnimatePresence>
    </>
  );
}
