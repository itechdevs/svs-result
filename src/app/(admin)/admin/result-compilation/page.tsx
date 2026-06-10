"use client";

import ResultCompilationTab from "@/components/admin/ResultCompilationTab";
import { AnimatePresence } from "motion/react";

export default function AdminResultCompilationPage() {
  return (
    <AnimatePresence mode="wait">
      <ResultCompilationTab />
    </AnimatePresence>
  );
}
