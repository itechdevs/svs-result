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

  const evalIds = useMemo(() => evaluations.map((e) => e.id), [evaluations]);

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
            reExamMark: null,
            reExamDate: '',
            remarks: r.remarks ?? '',
          },
        },
      });
    }

    setLocalMarks((prev) => {
      // Merge: keep any local edits that are NEWER than DB data
      // If a record doesn't exist in DB yet, keep any locally created one
      const dbList = Array.from(grouped.values());
      const localOnly = prev.filter(
        (m) => !grouped.has(`${m.studentId}::${m.evaluationId}`)
      );
      return [...dbList, ...localOnly];
    });
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
            // Support marks replace regular marks when present (Assessment After Support)
            const obtained =
              mark?.supportMark !== null && mark?.supportMark !== undefined
                ? mark.supportMark
                : mark?.regularMark;
            return {
              syncedStudentId: m.studentId,
              marksObtained:
                obtained !== null && obtained !== undefined ? obtained : undefined,
              isAbsent: false,
              remarks: mark?.remarks || undefined,
            };
          }),
        });
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
    setEvaluations,
  };

  return <MarksContext.Provider value={value}>{children}</MarksContext.Provider>;
}
