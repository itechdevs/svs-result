"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useEvaluationTemplates } from "@/hooks/use-evaluations";
import { useProfile } from "@/hooks/use-profile";
import { useDeleteEvaluationTemplate } from "@/hooks/use-evaluations";
import EvaluationsTab from "@/components/teacher/EvaluationsTab";
import { AnimatePresence, motion } from "motion/react";
import { EvaluationPlan } from "@/types/academic";
import { BookOpen } from "lucide-react";

export default function TeacherEvaluationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get("class") ?? "";
  const selectedSubject = searchParams.get("subject") ?? "";
  const hasSubject = !!(selectedClass && selectedSubject);

  const { data: profile } = useProfile();

  // Find the teacher's subject object matching the URL params
  const matchedSubject = useMemo(() => {
    if (!hasSubject || !profile?.syncedTeacher?.subjects) return null;
    return profile.syncedTeacher.subjects.find(
      (s) => s.name === selectedSubject && s.gradeLevel === selectedClass,
    );
  }, [hasSubject, selectedSubject, selectedClass, profile]);

  // Only fetch templates when a specific subject is selected
  const { data: templatesData = [] } = useEvaluationTemplates(
    matchedSubject ? { syncedSubjectId: matchedSubject.id, isActive: true } : {},
    { enabled: !!matchedSubject },
  );

  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');
  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState(selectedSubject);
  const deleteTemplate = useDeleteEvaluationTemplate();

  const assignedSubjectIds = useMemo(() =>
    new Set(profile?.syncedTeacher?.subjects.map(s => s.id) ?? []),
    [profile]
  );

  const evaluations: EvaluationPlan[] = useMemo(() => {
    if (!profile?.syncedTeacher || !matchedSubject) return [];

    const templates = templatesData.filter(t => assignedSubjectIds.has(t.syncedSubjectId));

    // Group by gradeConfigId+syncedSubjectId+evalTitle → one card per distinct evaluation plan
    const groups = new Map<string, typeof templates>();
    for (const t of templates) {
      const evalTitleMatch = t.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : '__legacy__';
      const evalTitle = rawEvalPart.split('|')[0];
      const key = `${t.gradeConfigId}::${t.syncedSubjectId}::${evalTitle}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    return Array.from(groups.entries()).map(([, group]) => {
      const first = group[0];
      const subjectName = first.syncedSubject?.name ?? 'Unknown';
      const gradeLevel = first.syncedSubject?.gradeLevel ?? first.gradeConfig?.gradeLevel ?? '';
      const academicYear = first.gradeConfig?.academicYear?.name ?? '';
      const evalTitleMatch = first.name.match(/^\[([^\]]+)\]\[/);
      const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : '';
      const [evalTitle, unitTitle = ''] = rawEvalPart.split('|');
      const totalFullMarks = group.reduce((s, t) => s + Number(t.fullMarks), 0);
      const totalPassMarks = group.reduce((s, t) => s + Number(t.passMarks), 0);
      const anyActive = group.some(t => t.isActive);

      // Without results fetch, all plans default to Active/Inactive
      const marksStatus = anyActive ? 'Active' : 'Inactive';
      const latestDate = group
        .map(t => t.scheduledDate ? new Date(t.scheduledDate) : null)
        .filter(Boolean)
        .sort((a, b) => b!.getTime() - a!.getTime())[0];

      return {
        id: first.id,
        title: evalTitle || subjectName,
        subjectTitle: gradeLevel ? `${subjectName} — ${gradeLevel}` : subjectName,
        subject: subjectName,
        gradeLevel,
        syncedSubjectId: first.syncedSubjectId,
        status: marksStatus,
        testTypes: `${group.length} Task${group.length !== 1 ? 's' : ''}`,
        outcomes: `${group.length} Outcome${group.length !== 1 ? 's' : ''}`,
        fullMarks: totalFullMarks,
        passMarks: totalPassMarks,
        date: latestDate
          ? latestDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : 'TBD',
        unit: unitTitle,
        learningOutcomes: group.map(t => {
          const newFormat = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
          const legacyFormat = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
          const taskType = newFormat ? newFormat[1] : (legacyFormat ? legacyFormat[1] : 'Standard');
          const outcomeName = newFormat ? newFormat[2] : (legacyFormat ? legacyFormat[2] : t.name);

          return {
            name: t.name,
            text: outcomeName,
            regularRating: 0,
            afterSupportRating: null,
            regularDate: t.scheduledDate ? new Date(t.scheduledDate).toISOString().split('T')[0] : '',
            supportDate: '',
            fullMarks: Number(t.fullMarks),
            passMarks: Number(t.passMarks),
            taskType: taskType,
          };
        }),
        subEvaluations: group.map(t => {
          // Supports both [EvalTitle][TaskType] OutcomeName and legacy [TaskType] OutcomeName
          const newFormat = t.name.match(/^\[[^\]]+\]\[([^\]]+)\]\s*(.+)$/);
          const legacyFormat = t.name.match(/^\[([^\]]+)\]\s*(.+)$/);
          const taskType = newFormat ? newFormat[1] : (legacyFormat ? legacyFormat[1] : 'Standard');
          const outcomeName = newFormat ? newFormat[2] : (legacyFormat ? legacyFormat[2] : t.name);
          return {
            id: t.id,
            name: outcomeName,
            fullMarks: Number(t.fullMarks),
            passMarks: Number(t.passMarks),
            weightage: Number(t.weightage),
            scheduledDate: t.scheduledDate,
            taskType,
          };
        }),
        templateIds: group.map(t => t.id),
      } satisfies EvaluationPlan;
    });
  }, [templatesData, assignedSubjectIds, matchedSubject]);

  const setCurrentTab = (tab: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (selectedClass) params.set("class", selectedClass);
    if (selectedSubject) params.set("subject", selectedSubject);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    }
    const suffix = params.toString() ? `?${params}` : "";
    if (tab === "create-evaluation") router.push(`/teacher/create-evaluation${suffix}`);
    else if (tab === "mark-entry") router.push(`/teacher/mark-entry${suffix}`);
    else if (tab === "result-compilation") router.push(`/teacher/result-compilation${suffix}`);
    else router.push("/teacher/dashboard");
  };

  return (
    <AnimatePresence mode="wait">
      {!hasSubject ? (
        <motion.div
          key="select-subject"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="bg-card rounded-xl border border-border shadow-sm p-12 text-center"
        >
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            Select a Subject
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose a class and subject from the sidebar to view and manage
            evaluation plans.
          </p>
        </motion.div>
      ) : (
        <EvaluationsTab
          evaluations={evaluations}
          setSelectedEvaluationId={setSelectedEvaluationId}
          setCurrentTab={setCurrentTab as any}
          setNewEvalTitle={setNewEvalTitle}
          setNewEvalSubject={setNewEvalSubject}
          newEvalSubject={newEvalSubject}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          onDelete={async (id) => {
            const plan = evaluations.find(e => e.id === id);
            const ids = plan?.templateIds ?? [id];
            for (const tid of ids) await deleteTemplate.mutateAsync(tid);
          }}
        />
      )}
    </AnimatePresence>
  );
}
