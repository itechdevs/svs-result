"use client";

import { useAcademicContext } from "@/contexts/AcademicContext";
import ResultCompilationTab from "@/components/admin/ResultCompilationTab";
import { AnimatePresence } from "motion/react";

export default function AdminResultCompilationPage() {
  const { handleCompilationComplete } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <ResultCompilationTab onCompilationComplete={handleCompilationComplete} />
    </AnimatePresence>
  );
}
