'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { StudentOutcomeMark, OutcomeMark } from '@/types/academic';
import {
  useStudentEvaluationResults,
  useBulkSaveMarks,
  EvaluationTemplate,
} from '@/hooks/use-evaluations';
import { apiClient } from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OutcomeColumn {
  evalId: string;
  name: string;        // full template name (key for outcomeMarks lookup)
  taskType: string;    // e.g. "Listening"
  outcomeName: string; // human-readable label
  fullMarks: number;
  passMarks: number;
  scheduledDate: string; // ISO date string or ''
}

interface MarksContextValue {
  // Shared state
  localMarks: StudentOutcomeMark[];

  // Bound to the currently selected evaluation group
  evaluations: EvaluationTemplate[];
  outcomeColumns: OutcomeColumn[];

  // Marks accessor / mutator
  getStudentMark: (studentId: string, evalId: string) => StudentOutcomeMark | undefined;
  updateOutcomeMark: (
    studentId: string,
    evalId: string,
    outcomeName: string,
    patch: Partial<OutcomeMark>
  ) => void;

  // Persistence
  handleSaveAll: (submit?: boolean) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  saved: boolean;

  // Setters so the overview table can push the active evaluation group
  setEvaluations: (evals: EvaluationTemplate[]) => void;
}

const MarksContext = createContext<MarksContextValue | null>(null);

export function useMarksContext(): MarksContextValue {
  const ctx = useContext(MarksContext);
  if (!ctx) throw new Error('useMarksContext must be used inside <MarksProvider>');
  return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function MarksProvider({ children }: { children: React.ReactNode }) {
  const [evaluations, setEvaluations] = useState<EvaluationTemplate[]>([]);
  const [localMarks, setLocalMarks] = useState<StudentOutcomeMark[]>([]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Track which evalId group has been initialized — only load from DB once per group
  const initializedEvalKey = useRef<string>('');

  const evalIds = useMemo(() => evaluations.map((e) => e.id), [evaluations]);

  const handleSetEvaluations = useCallback((evals: EvaluationTemplate[]) => {
    const newKey = evals.map(e => e.id).join(',');
    if (newKey !== initializedEvalKey.current) {
      // New group — reset so DB data loads fresh
      initializedEvalKey.current = '';
      setLocalMarks([]);
    }
    setEvaluations(evals);
  }, []);

  // Always fetch results for the selected evaluation group
  const { data: resultsData = [] } = useStudentEvaluationResults(
    evalIds.length > 0 ? { limit: 1000 } : {}
  );

  const bulkSave = useBulkSaveMarks();

  // Build outcome columns from evaluations
  const outcomeColumns: OutcomeColumn[] = useMemo(
    () =>
      evaluations.map((t) => {
        const newFormat = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFormat = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFormat
          ? newFormat[1]
          : legacyFormat
          ? legacyFormat[1]
          : t.name;
        const outcomeName = newFormat
          ? newFormat[2]
          : legacyFormat
          ? legacyFormat[2]
          : t.name;
        return {
          evalId: t.id,
          name: t.name,
          taskType,
          outcomeName,
          fullMarks: Number(t.fullMarks),
          passMarks: Number(t.passMarks),
          scheduledDate: t.scheduledDate
            ? new Date(t.scheduledDate).toISOString().split('T')[0]
            : '',
        };
      }),
    [evaluations]
  );

  // Sync DB results → localMarks whenever the results or evaluations change
  const evalIdSet = useMemo(() => new Set(evalIds), [evalIds]);
  const evalMap = useMemo(
    () => new Map(evaluations.map((e) => [e.id, e])),
    [evaluations]
  );

  useEffect(() => {
    if (evaluations.length === 0 || resultsData.length === 0) return;

    const currentKey = evalIds.join(',');
    // Only initialize from DB once per evaluation group — never overwrite local edits
    if (initializedEvalKey.current === currentKey) return;
    initializedEvalKey.current = currentKey;

    // Group results by (studentId, evalId) → ONE StudentOutcomeMark per (student, template)
    // Use template name as the outcomeMarks key (matches DetailedMarkEntryView lookup)
    const grouped = new Map<string, StudentOutcomeMark>();

    for (const r of resultsData) {
      if (!evalIdSet.has(r.evaluationTemplateId)) continue;
      const template = evalMap.get(r.evaluationTemplateId);
      if (!template) continue;

      // Key: studentId + evalId (one entry per sub-template)
      const key = `${r.syncedStudentId}::${r.evaluationTemplateId}`;
      grouped.set(key, {
        studentId: r.syncedStudentId,
        evaluationId: r.evaluationTemplateId,
        outcomeMarks: {
          [template.name]: {
            regularMark:
              r.marksObtained !== null && r.marksObtained !== undefined
                ? Number(r.marksObtained)
                : null,
            regularDate: r.submittedAt
              ? new Date(r.submittedAt).toISOString().split('T')[0]
              : '',
            supportMark: null,
            supportDate: '',
            // Populate re-exam data from the reExamResult relation saved via /teacher/re-exam-portal
            reExamMark:
              r.reExamResult?.marksObtained !== null &&
              r.reExamResult?.marksObtained !== undefined
                ? Number(r.reExamResult.marksObtained)
                : null,
            reExamDate: (r.reExamResult as any)?.reExamEnrollment?.reExamSchedule?.scheduledDate
              ? new Date((r.reExamResult as any).reExamEnrollment.reExamSchedule.scheduledDate).toISOString().split('T')[0]
              : r.reExamResult?.createdAt
              ? new Date(r.reExamResult.createdAt).toISOString().split('T')[0]
              : '',
            remarks: r.reExamResult?.remarks ?? r.remarks ?? '',
          },
        },
      });
    }

    setLocalMarks(Array.from(grouped.values()));
  }, [resultsData, evalIds.join(',')]);

  const getStudentMark = useCallback(
    (studentId: string, evalId: string) =>
      localMarks.find(
        (m) => m.studentId === studentId && m.evaluationId === evalId
      ),
    [localMarks]
  );

  const updateOutcomeMark = useCallback(
    (
      studentId: string,
      evalId: string,
      outcomeName: string,
      patch: Partial<OutcomeMark>
    ) => {
      setLocalMarks((prev) => {
        const isDatePatch = 'regularDate' in patch;

        if (isDatePatch) {
          // Propagate the regularDate update to all students for this template/outcome
          return prev.map((m) => {
            if (m.evaluationId === evalId) {
              const existing = m.outcomeMarks[outcomeName] ?? {
                regularMark: null,
                regularDate: '',
                supportMark: null,
                supportDate: '',
                reExamMark: null,
                reExamDate: '',
                remarks: '',
              };
              return {
                ...m,
                outcomeMarks: {
                  ...m.outcomeMarks,
                  [outcomeName]: { ...existing, regularDate: patch.regularDate! },
                },
              };
            }
            return m;
          });
        }

        const idx = prev.findIndex(
          (m) => m.studentId === studentId && m.evaluationId === evalId
        );
        const blank: OutcomeMark = {
          regularMark: null,
          regularDate: '',
          supportMark: null,
          supportDate: '',
          reExamMark: null,
          reExamDate: '',
          remarks: '',
        };
        if (idx === -1) {
          return [
            ...prev,
            {
              studentId,
              evaluationId: evalId,
              outcomeMarks: { [outcomeName]: { ...blank, ...patch } },
            },
          ];
        }
        const updated = [...prev];
        const existing = updated[idx].outcomeMarks[outcomeName] ?? blank;
        updated[idx] = {
          ...updated[idx],
          outcomeMarks: {
            ...updated[idx].outcomeMarks,
            [outcomeName]: { ...existing, ...patch },
          },
        };
        return updated;
      });
    },
    []
  );

  const handleSaveAll = useCallback(async (submit?: boolean) => {
    if (evaluations.length === 0) return;
    setSaveError(null);
    try {
      for (const t of evaluations) {
        const relevantMarks = localMarks.filter(
          (m) => m.evaluationId === t.id
        );
        if (relevantMarks.length === 0) continue;
        await bulkSave.mutateAsync({
          evaluationTemplateId: t.id,
          submit,
          results: relevantMarks.map((m) => {
            const mark = m.outcomeMarks[t.name];
            const obtained = mark?.regularMark;
            return {
              syncedStudentId: m.studentId,
              marksObtained:
                obtained !== null && obtained !== undefined ? obtained : undefined,
              isAbsent: false,
              remarks: mark?.remarks || undefined,
            };
          }),
        });

        // Save template regular date (scheduledDate) if changed
        const firstMark = relevantMarks[0]?.outcomeMarks[t.name];
        const newRegDate = firstMark?.regularDate;
        const oldRegDate = t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '';
        if (newRegDate && newRegDate !== oldRegDate) {
          await apiClient.patch(`/teacher/evaluation-plans/${t.id}`, {
            scheduledDate: new Date(newRegDate),
          });
          t.scheduledDate = new Date(newRegDate).toISOString();
        }

        // Save student-specific re-exam date if changed
        for (const m of relevantMarks) {
          const mark = m.outcomeMarks[t.name];
          if (mark?.reExamMark !== null && mark?.reExamMark !== undefined && mark?.reExamDate) {
            await apiClient.post('/admin/re-exam-portal', {
              evaluationTemplateId: t.id,
              syncedStudentId: m.studentId,
              marksObtained: mark.reExamMark,
              scheduledDate: new Date(mark.reExamDate),
              remarks: mark.remarks || undefined,
            });
          }
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Save failed. Please try again.';
      setSaveError(msg);
      setTimeout(() => setSaveError(null), 4000);
    }
  }, [evaluations, localMarks, bulkSave]);

  const value: MarksContextValue = {
    localMarks,
    evaluations,
    outcomeColumns,
    getStudentMark,
    updateOutcomeMark,
    handleSaveAll,
    isSaving: bulkSave.isPending,
    saveError,
    saved,
    setEvaluations: handleSetEvaluations,
  };

  return <MarksContext.Provider value={value}>{children}</MarksContext.Provider>;
}
