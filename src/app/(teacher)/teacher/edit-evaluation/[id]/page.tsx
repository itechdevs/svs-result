'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';
import { useEvaluationTemplate, useEvaluationTemplates } from '@/hooks/use-evaluations';
import { useExams } from '@/hooks/use-exams';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface OutcomeRow { name: string; date: string; max: number; pass: number; templateId?: string; }
interface TaskGroup { taskType: string; max: number; pass: number; outcomes: OutcomeRow[]; }

import SanskarLoader from '@/components/shared/SanskarLoader';

export default function EditEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';
  const selectedSection = searchParams.get('section') ?? '';
  const backUrl = `/teacher/evaluations${selectedClass || selectedSubject || selectedSection
    ? `?${new URLSearchParams({
        ...(selectedClass && { class: selectedClass }),
        ...(selectedSubject && { subject: selectedSubject }),
        ...(selectedSection && { section: selectedSection }),
      })}`
    : ''}`;

  const { data: template, isLoading: isTemplateLoading } = useEvaluationTemplate(id);
  const { data: allTemplates = [], isLoading: isTemplatesLoading } = useEvaluationTemplates();
  const { data: exams = [] } = useExams({
    gradeLevel: selectedClass,
    isActive: true,
  });

  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState('');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([]);

  const isLoading = isTemplateLoading || isTemplatesLoading;

  // Track original DB state for diffing on save
  const originalTemplateIds = useRef<Set<string>>(new Set());
  const groupMeta = useRef<{ gradeConfigId: string; syncedSubjectId: string; gradeLevel: string } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!template) return;
    if (initialized.current) return;
    if (allTemplates.length === 0) return;

    const newFormatMatch = template.name.match(/^\[([^\]]+)\]\[/);
    const rawEvalPart = newFormatMatch ? newFormatMatch[1] : '';
    const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');

    const group = allTemplates.filter(t => {
      if (t.gradeConfigId !== template.gradeConfigId) return false;
      if (t.syncedSubjectId !== template.syncedSubjectId) return false;
      if (evalTitle) return t.name.startsWith(`[${evalTitle}|`) || t.name.startsWith(`[${evalTitle}][`);
      return !t.name.match(/^\[[^\]]+\]\[/);
    });

    const resolvedGroup = group.length > 0 ? group : [template];

    // Store original IDs and metadata for diffing
    originalTemplateIds.current = new Set(resolvedGroup.map(t => t.id));
    groupMeta.current = {
      gradeConfigId: template.gradeConfigId,
      syncedSubjectId: template.syncedSubjectId,
      gradeLevel: template.syncedSubject?.gradeLevel ?? template.gradeConfig?.gradeLevel ?? '',
    };

    setNewEvalTitle(evalTitle || template.syncedSubject?.name || template.name);
    setNewSubjectTitle(unitTitle);
    setNewEvalSubject(template.syncedSubject?.name ?? '');
    setSelectedExamId(template.examId || '');
    setTargetMarks(resolvedGroup.reduce((s, t) => s + Number(t.fullMarks), 0));

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
    initialized.current = true;
  }, [template, allTemplates]);

  const setCurrentTab = (tab: string) => {
    if (tab === 'evaluations') router.push(backUrl);
    else if (tab === 'dashboard') router.push('/teacher/dashboard');
    else router.push(`/teacher/${tab}`);
  };

  const handleUpdate = async () => {
    if (!groupMeta.current) return;
    const { gradeConfigId, syncedSubjectId, gradeLevel } = groupMeta.current;

    const flatOutcomes = newOutcomes.flatMap(tg =>
      tg.outcomes.map(o => ({ ...o, taskType: tg.taskType }))
    );

    // Preserve existing weightage per template; only compute weightage for new ones
    const weightageMap = new Map<string, number>();
    const existingCount = flatOutcomes.filter(o => o.templateId).length;
    const newCount = flatOutcomes.filter(o => !o.templateId).length;
    const newWeightage = newCount > 0 ? parseFloat(((100 - existingCount) / newCount).toFixed(2)) : 0;

    let newIdx = 0;
    for (const outcome of flatOutcomes) {
      if (outcome.templateId) {
        weightageMap.set(outcome.templateId, 0); // will be looked up from DB
      } else {
        weightageMap.set(`new_${newIdx++}`, newWeightage);
      }
    }

    // Build a map of original weightages from the loaded templates
    const origWeightages = new Map<string, number>();
    for (const t of allTemplates) {
      origWeightages.set(t.id, Number(t.weightage));
    }

    // IDs still present in the updated UI
    const survivingIds = new Set(flatOutcomes.map(o => o.templateId).filter(Boolean) as string[]);
    // IDs that were in DB but removed from UI → delete them
    const toDelete = [...originalTemplateIds.current].filter(tid => !survivingIds.has(tid));

    const doUpdate = async () => {
      // 1. DELETE removed criteria
      for (const tid of toDelete) {
        await apiClient.delete(`/teacher/evaluation-plans/${tid}`);
      }
      // 2. UPDATE existing + CREATE new criteria
      let newIdx = 0;
      for (const [i, outcome] of flatOutcomes.entries()) {
        const newName = `[${newEvalTitle}|${newSubjectTitle}][${outcome.taskType}] ${outcome.name}`;

        if (outcome.templateId) {
          // UPDATE existing record — preserve original weightage
          const weightage = origWeightages.get(outcome.templateId) ?? 0;
          await apiClient.patch(`/teacher/evaluation-plans/${outcome.templateId}`, {
            name: newName,
            fullMarks: outcome.max,
            passMarks: outcome.pass,
            weightage,
            scheduledDate: outcome.date || undefined,
            displayOrder: i,
            examId: selectedExamId || undefined,
          });
        } else {
          // CREATE new record — use the same gradeConfigId so it stays in the same group
          await apiClient.post('/teacher/evaluation-plans', {
            gradeConfigId,
            syncedSubjectId,
            gradeLevel,
            examId: selectedExamId || undefined,
            name: newName,
            fullMarks: outcome.max,
            passMarks: outcome.pass,
            weightage: newWeightage,
            scheduledDate: outcome.date || undefined,
            displayOrder: i,
          });
          newIdx++;
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
    };

    toast.promise(doUpdate(), {
      loading: 'Updating evaluation…',
      success: () => { router.push(backUrl); return 'Evaluation updated successfully'; },
      error: (err: any) => err?.message || 'Failed to update evaluation',
    });
  };

  if (isLoading) {
    return <SanskarLoader variant="skeleton" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <CreateEvaluationTab
          newEvalTitle={newEvalTitle}
          setNewEvalTitle={setNewEvalTitle}
          newEvalSubject={newEvalSubject}
          setNewEvalSubject={setNewEvalSubject}
          newSubjectTitle={newSubjectTitle}
          setNewSubjectTitle={setNewSubjectTitle}
          selectedExamId={selectedExamId}
          setSelectedExamId={setSelectedExamId}
          exams={exams}
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
