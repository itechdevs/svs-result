"use client";

import MarkEntryOverviewTable from "@/components/teacher/MarkEntryOverviewTable";
import { AnimatePresence } from "motion/react";

export default function AdminMarkEntryPage() {
  return (
    <AnimatePresence mode="wait">
      <MarkEntryOverviewTable />
    </AnimatePresence>
  );
}
