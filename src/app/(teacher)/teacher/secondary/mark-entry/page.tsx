"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen, AlertCircle } from "lucide-react";
import { SecondaryMarkEntryFilters } from "@/components/teacher/secondary/SecondaryMarkEntryFilters";
import { ComponentTabs } from "@/components/teacher/secondary/ComponentTabs";
import { DirectMarksEntryTable } from "@/components/teacher/secondary/DirectMarksEntryTable";
import { PracticalMarksEntryTable } from "@/components/teacher/secondary/PracticalMarksEntryTable";
import { useSecondaryComponents } from "@/hooks/use-secondary-components";
import { useSecondaryMarkEntry } from "@/hooks/use-secondary-mark-entry";
import { usePracticalMarkEntry } from "@/hooks/use-practical-mark-entry";
import { useStudents } from "@/hooks/use-students";
import type { SecondaryComponentType } from "@/types/secondary-marks";
import SanskarLoader from "@/components/shared/SanskarLoader";

export default function SecondaryMarkEntryPage() {
  // Filter state
  const [academicYearId, setAcademicYearId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [syncedSubjectId, setSyncedSubjectId] = useState("");
  const [examId, setExamId] = useState("");

  // Active component tab
  const [activeComponentType, setActiveComponentType] = useState<SecondaryComponentType | null>(null);

  // Fetch subject configuration with components
  const {
    data: subjectConfig,
    isLoading: isLoadingConfig,
  } = useSecondaryComponents({
    syncedSubjectId,
    academicYearId,
    gradeLevel,
  });

  // Fetch students for the selected class
  const { data: studentsData, isLoading: isLoadingStudents } = useStudents(
    gradeLevel ? { class: gradeLevel, limit: 9999 } : { limit: 1 }
  );

  const students = studentsData?.students || [];

  // Get active component
  const activeComponent = subjectConfig?.components?.find(
    (c) => c.type === activeComponentType
  );

  // Marks entry hook for direct marks (INTERNAL/THEORY)
  const {
    markEntryRows,
    stats,
    isLoading: isLoadingMarks,
    updateMark,
    saveAll,
    submitAll,
    isSaving,
    isSubmitting,
    hasUnsavedChanges,
  } = useSecondaryMarkEntry({
    componentId: activeComponent?.id || "",
    examId,
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber || "",
      section: s.section || "",
    })),
  });

  // Practical marks entry hook
  const {
    practicalMarkEntryRows,
    isLoading: isLoadingPracticalMarks,
    updateHeadingMark,
    updateAbsent,
    saveAll: savePracticalAll,
    submitAll: submitPracticalAll,
    isSaving: isSavingPractical,
    isSubmitting: isSubmittingPractical,
    hasUnsavedChanges: hasPracticalUnsavedChanges,
    stats: practicalStats,
  } = usePracticalMarkEntry({
    componentId: activeComponent?.id || "",
    examId,
    practicalHeadings: activeComponent?.practicalHeadings || [],
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber || "",
      section: s.section || "",
    })),
  });

  // Auto-select first component when config loads - moved to useEffect
  useEffect(() => {
    if (subjectConfig?.components && subjectConfig.components.length > 0 && !activeComponentType) {
      const firstComponent = subjectConfig.components.sort((a, b) => a.displayOrder - b.displayOrder)[0];
      setActiveComponentType(firstComponent.type);
    }
  }, [subjectConfig, activeComponentType]);

  const allFiltersSelected = academicYearId && gradeLevel && syncedSubjectId && examId;
  const showContent = allFiltersSelected && subjectConfig;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          Secondary Mark Entry
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Enter Internal, Theory, and Practical marks for Secondary levels (Grades 6-12).
        </p>
      </div>

      {/* Filters */}
      <SecondaryMarkEntryFilters
        academicYearId={academicYearId}
        gradeLevel={gradeLevel}
        syncedSubjectId={syncedSubjectId}
        examId={examId}
        onAcademicYearChange={setAcademicYearId}
        onGradeLevelChange={setGradeLevel}
        onSubjectChange={setSyncedSubjectId}
        onExamChange={setExamId}
      />

      {/* Content Area */}
      {!allFiltersSelected ? (
        <div className="bg-card border border-dashed rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground">Ready to Start</p>
          <p className="text-sm text-muted-foreground mt-1">
            Select all filters above to begin entering marks
          </p>
        </div>
      ) : isLoadingConfig ? (
        <SanskarLoader message="Loading subject configuration..." />
      ) : !subjectConfig ? (
        <div className="bg-card border border-amber-200 dark:border-amber-800 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-foreground">Subject Not Configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            This subject has not been configured for secondary marks entry.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Please contact the administrator to set up component configurations (Internal, Theory, Practical).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Component Tabs */}
          <ComponentTabs
            components={subjectConfig.components}
            activeComponentType={activeComponentType}
            onComponentChange={setActiveComponentType}
          />

          {/* Progress Stats */}
          {activeComponent && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Total Students</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Entered</div>
                <div className="text-2xl font-bold text-blue-600">{stats.enteredCount}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Absent</div>
                <div className="text-2xl font-bold text-amber-600">{stats.absentCount}</div>
              </div>
              <div className="bg-card border rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Completion</div>
                <div className="text-2xl font-bold text-green-600">{stats.completionPercentage}%</div>
              </div>
            </div>
          )}

          {/* Marks Entry Table */}
          {activeComponent && (
            <>
              {isLoadingStudents || isLoadingMarks || isLoadingPracticalMarks ? (
                <SanskarLoader message="Loading students and marks..." />
              ) : activeComponent.type === "PRACTICAL" ? (
                <PracticalMarksEntryTable
                  rows={practicalMarkEntryRows}
                  practicalHeadings={activeComponent.practicalHeadings || []}
                  fullMarks={Number(activeComponent.fullMarks)}
                  passMarks={Number(activeComponent.passMarks)}
                  onMarkChange={updateHeadingMark}
                  onAbsentChange={updateAbsent}
                  onSaveAll={savePracticalAll}
                  onSubmitAll={submitPracticalAll}
                  isSaving={isSavingPractical}
                  isSubmitting={isSubmittingPractical}
                  hasUnsavedChanges={hasPracticalUnsavedChanges}
                />
              ) : (
                <DirectMarksEntryTable
                  rows={markEntryRows}
                  fullMarks={Number(activeComponent.fullMarks)}
                  passMarks={Number(activeComponent.passMarks)}
                  componentType={activeComponent.type}
                  onMarkChange={updateMark}
                  onSaveAll={saveAll}
                  onSubmitAll={submitAll}
                  isSaving={isSaving}
                  isSubmitting={isSubmitting}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
              )}
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
