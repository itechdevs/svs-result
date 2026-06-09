"use client";

import ReExamPortalTab from "@/components/admin/ReExamPortalTab";
import { AnimatePresence } from "motion/react";

export default function AdminReExamPage() {
  return (
    <AnimatePresence mode="wait">
      <ReExamPortalTab />
    </AnimatePresence>
  );
}
