"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReExamPortalTab from "@/components/admin/ReExamPortalTab";
import { useProfile } from "@/hooks/use-profile";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import { ClipboardX } from "lucide-react";

function getSchoolLevel(
  gradeLevel: string,
  dbMap: Map<string, string>,
): string {
  return dbMap.get(gradeLevel) ?? "PRIMARY";
}

export default function TeacherReExamPage() {
  const { data: profile } = useProfile();
  const { data: categories } = useGradeLevelCategories();

  const hasEligible = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    if (subjects.length === 0) return false;

    const dbMap = new Map<string, string>();
    for (const c of categories ?? []) {
      dbMap.set(c.gradeLevel, c.schoolLevel);
    }

    return subjects.some((s) => {
      const level = getSchoolLevel(s.gradeLevel, dbMap);
      return level === "PRE_PRIMARY" || level === "PRIMARY";
    });
  }, [profile, categories]);

  if (!hasEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ClipboardX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Re-Exam Not Available
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Re-examination is only available for Pre-Primary and Primary grade
          levels. Your assigned subjects are at the Secondary or Higher level.
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <ReExamPortalTab />
    </AnimatePresence>
  );
}
