"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useAcademicContext } from "@/contexts/AcademicContext";
import EvaluationsTab from "@/components/teacher/EvaluationsTab";
import { AnimatePresence } from "motion/react";

export default function TeacherEvaluationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedClass = searchParams.get("class") ?? "";
  const selectedSubject = searchParams.get("subject") ?? "";

  const {
    evaluations,
    setSelectedEvaluationId,
    setNewEvalTitle,
    setNewEvalSubject,
    newEvalSubject,
    evaluationForClassSubject,
    assignedClasses,
    subjectsForClass,
  } = useAcademicContext();

  // Evaluations visible to this teacher for the selected class/subject filter.
  // If no filter, show all evaluations whose subject is assigned to this teacher.
  const assignedEvalIds = useMemo(() => {
    const ids = new Set<string>();
    assignedClasses.forEach(cls =>
      subjectsForClass(cls).forEach(subj => {
        const id = evaluationForClassSubject(cls, subj);
        if (id) ids.add(id);
      })
    );
    return ids;
  }, [assignedClasses, subjectsForClass, evaluationForClassSubject]);

  const filteredEvaluations = useMemo(() => {
    const base = evaluations.filter(e => assignedEvalIds.has(e.id));
    if (selectedSubject) return base.filter(e => e.subject === selectedSubject);
    return base;
  }, [evaluations, assignedEvalIds, selectedSubject]);

  const setCurrentTab = (tab: string) => {
    if (tab === "create-evaluation") {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSubject) params.set("subject", selectedSubject);
      const qs = params.toString();
      router.push(`/teacher/create-evaluation${qs ? `?${qs}` : ""}`);
    } else if (tab === "mark-entry") {
      const params = new URLSearchParams();
      if (selectedClass) params.set("class", selectedClass);
      if (selectedSubject) params.set("subject", selectedSubject);
      const qs = params.toString();
      router.push(`/teacher/mark-entry${qs ? `?${qs}` : ""}`);
    } else {
      router.push("/teacher/dashboard");
    }
  };

  return (
    <AnimatePresence mode="wait">
      <EvaluationsTab
        evaluations={filteredEvaluations}
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
