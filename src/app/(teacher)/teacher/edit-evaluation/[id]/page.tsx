'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CreateEvaluationTab from '@/components/teacher/CreateEvaluationTab';
import { AnimatePresence } from 'motion/react';
import { useEvaluationTemplate, useEvaluationTemplates, useStudentEvaluationResults } from '@/hooks/use-evaluations';
import {
  buildEvaluationName,
  findDuplicateEvaluationNames,
  findGroupSiblings,
  generateEvaluationBatchId,
  parseEvaluationName,
} from '@/lib/evaluation-grouping';
import { useExams } from '@/hooks/use-exams';
import { useAcademicYears } from '@/hooks/use-academic-config';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
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
  const { data: resultsData = [], isLoading: isResultsLoading } = useStudentEvaluationResults({ limit: 5000 });
  const { data: academicYears } = useAcademicYears();

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');

  const { data: allExams = [] } = useExams({
    ...(selectedAcademicYearId && { academicYearId: selectedAcademicYearId }),
    isActive: true,
  });

  // Match exams by gradeLevel/section (same as create page)
  const exams = useMemo(() => {
    if (!selectedClass) return allExams;
    return allExams.filter((exam) => {
      const g = exam.gradeLevel;
      if (g === selectedClass) return true;
      if (selectedSection) {
        if (g === `${selectedClass} - ${selectedSection}`) return true;
        if (g === `${selectedClass} ${selectedSection}`) return true;
        if (g === `${selectedClass}-${selectedSection}`) return true;
      }
      return false;
    });
  }, [allExams, selectedClass, selectedSection]);

  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState('');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([]);

  const isLoading = isTemplateLoading || isTemplatesLoading || isResultsLoading;

  // Published plans (any non-DRAFT student result in this plan's group) are
  // locked — the form is not offered and the API also rejects updates.
  const isPublished = useMemo(() => {
    if (!template || allTemplates.length === 0) return false;
    const ids = new Set(findGroupSiblings(template, allTemplates).map((t) => t.id));
    return resultsData.some(
      (r) => ids.has(r.evaluationTemplateId) && r.status !== 'DRAFT',
    );
  }, [template, allTemplates, resultsData]);

  // Track original DB state for diffing on save
  const originalTemplateIds = useRef<Set<string>>(new Set());
  const groupMeta = useRef<{ gradeConfigId: string; syncedSubjectId: string; gradeLevel: string; batchId: string } | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!template) return;
    if (initialized.current) return;
    if (allTemplates.length === 0) return;

    const { evalTitle, unitTitle, batchId } = parseEvaluationName(template.name);

    // Resolve ONLY this plan's templates (same grade config + subject + exam
    // + title + unit + batch) so same-title fresh evaluations stay separate.
    const group = findGroupSiblings(template, allTemplates);

    const resolvedGroup = group.length > 0 ? group : [template];

    // Store original IDs and metadata for diffing
    originalTemplateIds.current = new Set(resolvedGroup.map(t => t.id));
    groupMeta.current = {
      gradeConfigId: template.gradeConfigId,
      syncedSubjectId: template.syncedSubjectId,
      gradeLevel: template.syncedSubject?.gradeLevel ?? template.gradeConfig?.gradeLevel ?? '',
      // Legacy plans have no batch — stamp one now so this plan separates
      // from any same-title duplicates when it is saved.
      batchId: batchId || generateEvaluationBatchId(),
    };

    setNewEvalTitle(evalTitle || template.syncedSubject?.name || template.name);
    setNewSubjectTitle(unitTitle);
    setNewEvalSubject(template.syncedSubject?.name ?? '');
    setSelectedExamId(template.examId || '');

    // Auto-select the template's academic year so exams are filtered correctly
    if (template.gradeConfig?.academicYear?.id) {
      setSelectedAcademicYearId(template.gradeConfig.academicYear.id);
    }
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
    const { gradeConfigId, syncedSubjectId, gradeLevel, batchId } = groupMeta.current;

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

    // Block duplicate criteria names BEFORE any API call: two rows building
    // the same stored template name would otherwise collide on the DB unique
    // constraint (one PATCH fails with a 500 and earlier renames are left
    // half-applied).
    const newNames = flatOutcomes.map((outcome) =>
      buildEvaluationName(
        newEvalTitle,
        newSubjectTitle,
        batchId,
        outcome.taskType,
        outcome.name,
      ),
    );
    const dupes = findDuplicateEvaluationNames(newNames);
    if (dupes.length > 0) {
      toast.error(
        `Duplicate criteria: "${dupes[0]}" appears ${newNames.filter((n) => n === dupes[0]).length} times. Each criteria (task type + outcome name) must be unique within the evaluation.`,
      );
      return;
    }

    const doUpdate = async () => {
      // 1. DELETE removed criteria
      for (const tid of toDelete) {
        await apiClient.delete(`/teacher/evaluation-plans/${tid}`);
      }
      // 2. UPDATE existing + CREATE new criteria
      let newIdx = 0;
      for (const [i, outcome] of flatOutcomes.entries()) {
        // Preserve this plan's batchId so the edited plan keeps its own
        // group even when the visible title matches another evaluation.
        // (Already duplicate-checked above.)
        const newName = newNames[i];

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

  if (isPublished) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Evaluation Locked</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This evaluation has been published and can no longer be edited.
        </p>
        <Button onClick={() => router.push(backUrl)} className="font-bold text-xs">
          Back to Evaluations
        </Button>
      </div>
    );
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
          academicYears={academicYears}
          selectedAcademicYearId={selectedAcademicYearId}
          setSelectedAcademicYearId={setSelectedAcademicYearId}
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
