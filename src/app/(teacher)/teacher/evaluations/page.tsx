"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useEvaluationTemplates } from "@/hooks/use-evaluations";
import { useProfile } from "@/hooks/use-profile";
import EvaluationsTab from "@/components/teacher/EvaluationsTab";
import { AnimatePresence } from "motion/react";
import { EvaluationPlan } from "@/types/academic";

export default function TeacherEvaluationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get("class") ?? "";
  const selectedSubject = searchParams.get("subject") ?? "";

  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: profile } = useProfile();

  const [selectedEvaluationId, setSelectedEvaluationId] = useState('');
  const [newEvalTitle, setNewEvalTitle] = useState('');
  const [newEvalSubject, setNewEvalSubject] = useState(selectedSubject);

  // Derive assigned subject IDs for this teacher
  const assignedSubjectIds = useMemo(() => {
    return new Set(profile?.syncedTeacher?.subjects.map(s => s.id) ?? []);
  }, [profile]);

  const evaluations: EvaluationPlan[] = useMemo(() => {
    let templates = templatesData;

    // Filter by teacher's assigned subjects
    if (profile && assignedSubjectIds.size > 0) {
      templates = templates.filter(t => assignedSubjectIds.has(t.syncedSubjectId));
    }

    // Filter by URL params
    if (selectedSubject) {
      templates = templates.filter(t => (t.syncedSubject?.name ?? '') === selectedSubject);
    }

    return templates.map(t => ({
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
    }));
  }, [templatesData, assignedSubjectIds, selectedSubject]);

  const setCurrentTab = (tab: string) => {
    if (tab === "create-evaluation") {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSubject) params.set("subject", selectedSubject);
      router.push(`/teacher/create-evaluation${params.toString() ? `?${params}` : ""}`);
    } else if (tab === "mark-entry") {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSubject) params.set("subject", selectedSubject);
      router.push(`/teacher/mark-entry${params.toString() ? `?${params}` : ""}`);
    } else {
      router.push("/teacher/dashboard");
    }
  };

  return (
    <AnimatePresence mode="wait">
      <EvaluationsTab
        evaluations={evaluations}
        setSelectedEvaluationId={setSelectedEvaluationId}
        setCurrentTab={setCurrentTab as any}
        setNewEvalTitle={setNewEvalTitle}
        setNewEvalSubject={setNewEvalSubject}
        newEvalSubject={newEvalSubject}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
      />
    </AnimatePresence>
  );
}
