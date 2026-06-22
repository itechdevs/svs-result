"use client";

import { useParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
import ExamDetailClient from "@/components/admin/ExamDetailClient";

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params.id as string;

  return (
    <AnimatePresence mode="wait">
      <ExamDetailClient examId={examId} />
    </AnimatePresence>
  );
}
