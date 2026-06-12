"use client";

import AllocationsTab from "@/components/admin/AllocationsTab";
import { AnimatePresence } from "motion/react";

export default function AdminAllocationsPage() {
  return (
    <AnimatePresence mode="wait">
      <AllocationsTab />
    </AnimatePresence>
  );
}
