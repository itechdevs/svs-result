"use client";

import { useRouter } from "next/navigation";
import { useAcademicContext } from "@/contexts/AcademicContext";
import EvaluationsTab from "@/components/teacher/EvaluationsTab";
import { AnimatePresence } from "motion/react";

export default function TeacherEvaluationsPage() {
  const router = useRouter();
  const {
    evaluations,
    setSelectedEvaluationId,
    setNewEvalTitle,
    setNewEvalSubject,
    newEvalSubject,
  } = useAcademicContext();

  const setCurrentTab = (tab: string) => {
    if (tab === "create-evaluation") router.push("/teacher/create-evaluation");
    else if (tab === "mark-entry") router.push("/teacher/mark-entry");
    else router.push("/teacher/dashboard");
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
      />
    </AnimatePresence>
  );
}
