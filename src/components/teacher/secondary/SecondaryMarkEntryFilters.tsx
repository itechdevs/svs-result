"use client";

import { useEffect, useMemo } from "react";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useGradeLevels } from "@/hooks/use-subjects";
import { useTeacherSubjects } from "@/hooks/use-teacher-subjects";
import { useExams } from "@/hooks/use-exams";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface SecondaryMarkEntryFiltersProps {
  academicYearId: string;
  gradeLevel: string;
  syncedSubjectId: string;
  examId: string;
  onAcademicYearChange: (value: string) => void;
  onGradeLevelChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onExamChange: (value: string) => void;
}

export function SecondaryMarkEntryFilters({
  academicYearId,
  gradeLevel,
  syncedSubjectId,
  examId,
  onAcademicYearChange,
  onGradeLevelChange,
  onSubjectChange,
  onExamChange,
}: SecondaryMarkEntryFiltersProps) {
  const { data: academicYears, isLoading: isLoadingYears } = useAcademicYears();
  const { data: allGradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const { subjects: teacherSubjects, isLoading: isLoadingSubjects } = useTeacherSubjects({
    gradeLevel: gradeLevel || undefined,
  });
  const { data: exams, isLoading: isLoadingExams } = useExams({
    academicYearId: academicYearId || undefined,
    gradeLevel: gradeLevel || undefined,
  });
  const { data: categories } = useGradeLevelCategories();

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories ?? []) {
      map.set(c.gradeLevel, c.schoolLevel);
    }
    return map;
  }, [categories]);

  // Filter to only secondary and higher secondary grades
  const secondaryGrades = allGradeLevels?.filter((grade) => {
    const category = categoryMap.get(grade);
    return category === "SECONDARY" || category === "HIGHER";
  }) || [];

  const currentYear = academicYears?.find((y) => y.isCurrent);

  // Debug logging
  useEffect(() => {
    console.log('[SecondaryMarkEntryFilters] Teacher subjects for grade:', {
      gradeLevel,
      subjects: teacherSubjects,
      isLoading: isLoadingSubjects,
    });
  }, [gradeLevel, teacherSubjects, isLoadingSubjects]);

  useEffect(() => {
    console.log('[SecondaryMarkEntryFilters] Current selections:', {
      academicYearId,
      gradeLevel,
      syncedSubjectId,
      examId,
    });
  }, [academicYearId, gradeLevel, syncedSubjectId, examId]);

  // Auto-select current academic year if none selected - moved to useEffect
  useEffect(() => {
    if (!academicYearId && currentYear && !isLoadingYears) {
      onAcademicYearChange(currentYear.id);
    }
  }, [academicYearId, currentYear, isLoadingYears, onAcademicYearChange]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academic Year */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
            Academic Year
          </label>
          <Select
            value={academicYearId}
            onValueChange={onAcademicYearChange}
            disabled={isLoadingYears}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.isCurrent && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grade Level */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
            Grade Level
          </label>
          <Select
            value={gradeLevel}
            onValueChange={(value) => {
              onGradeLevelChange(value);
              // Reset subject and exam when grade changes
              onSubjectChange("");
              onExamChange("");
            }}
            disabled={isLoadingGrades || !academicYearId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {secondaryGrades.length > 0 ? (
                secondaryGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No secondary grades available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
            Subject
          </label>
          <Select
            value={syncedSubjectId}
            onValueChange={(value) => {
              onSubjectChange(value);
              // Reset exam when subject changes
              onExamChange("");
            }}
            disabled={isLoadingSubjects || !gradeLevel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                !gradeLevel 
                  ? "Select grade first" 
                  : isLoadingSubjects 
                  ? "Loading subjects..." 
                  : "Select subject"
              } />
            </SelectTrigger>
            <SelectContent>
              {isLoadingSubjects ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading subjects...
                </div>
              ) : teacherSubjects.length > 0 ? (
                teacherSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-6 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    No subjects assigned
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {gradeLevel
                      ? `You don't have any subjects assigned for ${gradeLevel}`
                      : "Select a grade level first"}
                  </p>
                </div>
              )}
            </SelectContent>
          </Select>
          {!isLoadingSubjects && gradeLevel && teacherSubjects.length === 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              No subjects assigned for this grade. Contact admin.
            </p>
          )}
        </div>

        {/* Exam/Term */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
            Exam/Term
          </label>
          <Select
            value={examId}
            onValueChange={onExamChange}
            disabled={isLoadingExams || !gradeLevel || !syncedSubjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                !gradeLevel || !syncedSubjectId
                  ? "Select grade & subject"
                  : isLoadingExams
                  ? "Loading exams..."
                  : "Select exam"
              } />
            </SelectTrigger>
            <SelectContent>
              {isLoadingExams ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading exams...
                </div>
              ) : exams && exams.length > 0 ? (
                exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-6 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    No exams available
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {gradeLevel && syncedSubjectId
                      ? `No exams created for ${gradeLevel}`
                      : "Select grade and subject first"}
                  </p>
                </div>
              )}
            </SelectContent>
          </Select>
          {!isLoadingExams && gradeLevel && syncedSubjectId && exams?.length === 0 && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              No exams created yet. Contact admin.
            </p>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {!academicYearId || !gradeLevel || !syncedSubjectId || !examId ? (
        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Please select all filters above to start entering marks
          </p>
        </div>
      ) : null}
    </div>
  );
}
