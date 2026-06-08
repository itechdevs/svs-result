"use client";

import { useAcademicContext } from "@/contexts/AcademicContext";
import AllocationsTab from "@/components/admin/AllocationsTab";
import { AnimatePresence } from "motion/react";

export default function AdminAllocationsPage() {
  const { allocations, toggleTeacherStatus, handleImportSuccess } = useAcademicContext();

  return (
    <AnimatePresence mode="wait">
      <AllocationsTab
        allocations={allocations}
        toggleTeacherStatus={toggleTeacherStatus}
        onImportSuccess={handleImportSuccess}
      />
    </AnimatePresence>
  );
}
