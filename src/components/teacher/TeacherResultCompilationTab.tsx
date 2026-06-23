'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckCircle,
  Save,
  Send,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  useEvaluationTemplates,
  useStudentEvaluationResults,
  EvaluationTemplate,
} from '@/hooks/use-evaluations';
import { useProfile } from '@/hooks/use-profile';
import { useStudents } from '@/hooks/use-students';
import {
  useTeacherSubjectCompilations,
  useCreateTeacherCompilation,
  useSubmitTeacherCompilation,
} from '@/hooks/use-teacher-compilations';
import { useAcademicYears } from '@/hooks/use-academic-config';
import { useExams } from '@/hooks/use-exams';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shared/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalPlanGroup {
  planTitle: string;   // e.g. "Science Unit 1"
  unitTitle: string;   // e.g. "Unit1"
  templates: EvaluationTemplate[];
  totalFullMarks: number;
  totalPassMarks: number;
}

interface CompiledStudentResult {
  studentId: string;
  rollNo: string;
  studentName: string;
  planMarks: Record<string, { obtained: number | null; full: number; passed: boolean | null }>;
  totalObtained: number;
  totalFull: number;
  percentage: number;
  grade: string;
  result: 'Pass' | 'Fail' | 'Pending';
  hasReExam: boolean;
}

interface Props {
  onBack?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanTitle(name: string, subjectName: string): { planTitle: string; unitTitle: string } {
  const newFmt = name.match(/^\[([^\]]+)\]\[/);
  if (newFmt) {
    const [evalTitle, unitTitle = ''] = newFmt[1].split('|');
    return { planTitle: evalTitle.trim(), unitTitle: unitTitle.trim() };
  }
  // Legacy or simple format — use subject name as plan title
  return { planTitle: subjectName, unitTitle: '' };
}

function getTaskType(name: string): string {
  const newFmt = name.match(/^\[[^\]]+\]\[([^\]]+)\]/);
  if (newFmt) return newFmt[1];
  const legacyFmt = name.match(/^\[([^\]]+)\]/);
  if (legacyFmt) return legacyFmt[1];
  return 'Standard';
}

function getOutcomeText(name: string): string {
  const newFmt = name.match(/^\[[^\]]+\]\[[^\]]+\]\s*(.+)$/);
  if (newFmt) return newFmt[1];
  const legacyFmt = name.match(/^\[[^\]]+\]\s*(.+)$/);
  if (legacyFmt) return legacyFmt[1];
  return name;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherResultCompilationTab({ onBack }: Props) {
  const searchParams = useSearchParams();
  const { data: profile } = useProfile();
  const { data: academicYears = [] } = useAcademicYears();

  const selectedClass = searchParams.get('class') ?? '';
  const selectedSubject = searchParams.get('subject') ?? '';
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedExam, setSelectedExam] = useState('all');
  // Selected plan titles (not template IDs)
  const [selectedPlanTitles, setSelectedPlanTitles] = useState<string[]>([]);
  // Expanded plan titles (for showing sub-outcomes)
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const createCompilation = useCreateTeacherCompilation();
  const submitCompilation = useSubmitTeacherCompilation();

  // Auto-select current academic year
  useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYear) {
      const currentYear = academicYears.find((y) => y.isCurrent);
      setSelectedAcademicYear(currentYear ? currentYear.id : academicYears[0].id);
    }
  }, [academicYears, selectedAcademicYear]);

  // Reset exam & selection when academic year changes
  const prevYear = useRef(selectedAcademicYear);
  useEffect(() => {
    if (prevYear.current !== selectedAcademicYear) {
      prevYear.current = selectedAcademicYear;
      setSelectedExam('all');
      setSelectedPlanTitles([]);
    }
  }, [selectedAcademicYear]);

  const { data: exams = [] } = useExams(
    selectedAcademicYear ? { academicYearId: selectedAcademicYear } : undefined,
  );
  const { data: templatesData = [] } = useEvaluationTemplates(
    selectedAcademicYear ? { academicYearId: selectedAcademicYear } : {},
  );
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 5000 });
  const { data: studentsData } = useStudents({ limit: 500 });

  const { data: existingCompilations = [] } = useTeacherSubjectCompilations({
    academicYearId: selectedAcademicYear || undefined,
    gradeLevel: selectedClass || undefined,
  });

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  // Assigned subjects from teacher profile
  const subjects = useMemo(() => {
    const teacherSubjects = profile?.syncedTeacher?.subjects ?? [];
    return teacherSubjects
      .filter((s) => s.gradeLevel === selectedClass)
      .map((s) => ({ id: s.id, name: s.name, gradeLevel: s.gradeLevel }));
  }, [profile, selectedClass]);

  // Filtered templates for selected subject + exam
  const filteredTemplates = useMemo(() => {
    if (!selectedSubject) return [];
    return templatesData.filter((t) => {
      if (t.syncedSubject?.name !== selectedSubject) return false;
      if (!t.isActive) return false;
      if (
        t.gradeConfig?.academicYear?.id &&
        t.gradeConfig.academicYear.id !== selectedAcademicYear
      )
        return false;
      if (selectedExam !== 'all' && t.examId && t.examId !== selectedExam) return false;
      return true;
    });
  }, [templatesData, selectedSubject, selectedAcademicYear, selectedExam]);

  // Build a map: templateId → highest status in that template
  const templateStatusMap = useMemo(() => {
    const map = new Map<string, 'SUBMITTED' | 'DRAFT'>();
    for (const r of resultsData) {
      const prev = map.get(r.evaluationTemplateId);
      if (r.status === 'SUBMITTED' || r.status === 'VERIFIED' || r.status === 'LOCKED') {
        map.set(r.evaluationTemplateId, 'SUBMITTED');
      } else if (!prev) {
        map.set(r.evaluationTemplateId, 'DRAFT');
      }
    }
    return map;
  }, [resultsData]);

  // Group templates by evaluation plan title
  const evalPlanGroups = useMemo((): EvalPlanGroup[] => {
    const map = new Map<string, EvalPlanGroup>();
    for (const t of filteredTemplates) {
      const { planTitle, unitTitle } = getPlanTitle(t.name, selectedSubject);
      if (!map.has(planTitle)) {
        map.set(planTitle, {
          planTitle,
          unitTitle,
          templates: [],
          totalFullMarks: 0,
          totalPassMarks: 0,
        });
      }
      const group = map.get(planTitle)!;
      group.templates.push(t);
      group.totalFullMarks += Number(t.fullMarks);
      group.totalPassMarks += Number(t.passMarks);
    }

    // Filter to only show "Published" evaluations
    return Array.from(map.values()).filter(group => {
      const groupStatuses = group.templates.map(t => templateStatusMap.get(t.id));
      return groupStatuses.some(s => s === 'SUBMITTED');
    });
  }, [filteredTemplates, selectedSubject, templateStatusMap]);

  // All template IDs from selected plans
  const selectedTemplateIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of evalPlanGroups) {
      if (selectedPlanTitles.includes(group.planTitle)) {
        group.templates.forEach((t) => ids.push(t.id));
      }
    }
    return ids;
  }, [evalPlanGroups, selectedPlanTitles]);

  // Students for selected class
  const filteredStudents = useMemo(
    () => students.filter((s) => s.class === selectedClass),
    [students, selectedClass],
  );

  // Marks lookup: [studentId][templateId] = { marks, hasReExam }
  const marksLookup = useMemo(() => {
    const lookup: Record<string, Record<string, { marks: number | null; hasReExam: boolean }>> = {};
    for (const r of resultsData) {
      if (!lookup[r.syncedStudentId]) lookup[r.syncedStudentId] = {};
      const reExamMarks = r.reExamResult?.marksObtained;
      const hasReExam = reExamMarks !== null && reExamMarks !== undefined;
      const effectiveMarks = hasReExam
        ? Number(reExamMarks)
        : r.marksObtained !== null && r.marksObtained !== undefined
          ? Number(r.marksObtained)
          : null;
      lookup[r.syncedStudentId][r.evaluationTemplateId] = { marks: effectiveMarks, hasReExam };
    }
    return lookup;
  }, [resultsData]);

  // Compiled results per student
  const compiledResults = useMemo((): CompiledStudentResult[] => {
    if (selectedPlanTitles.length === 0 || filteredStudents.length === 0) return [];

    const selectedGroups = evalPlanGroups.filter((g) =>
      selectedPlanTitles.includes(g.planTitle),
    );

    return filteredStudents.map((student) => {
      const planMarks: CompiledStudentResult['planMarks'] = {};
      let totalObtained = 0;
      let totalFull = 0;
      let hasAnyMarks = false;
      let hasFailed = false;
      let hasReExam = false;

      for (const group of selectedGroups) {
        let groupObtained = 0;
        let groupFull = 0;
        let groupHasMarks = false;
        let groupFailed = false;

        for (const t of group.templates) {
          const entry = marksLookup[student.id]?.[t.id];
          if (entry?.hasReExam) hasReExam = true;
          groupFull += Number(t.fullMarks);
          if (entry?.marks !== null && entry?.marks !== undefined) {
            groupHasMarks = true;
            groupObtained += entry.marks;
            if (entry.marks < Number(t.passMarks)) groupFailed = true;
          }
        }

        planMarks[group.planTitle] = {
          obtained: groupHasMarks ? groupObtained : null,
          full: group.totalFullMarks,
          passed: groupHasMarks ? !groupFailed : null,
        };

        totalFull += groupFull;
        if (groupHasMarks) {
          hasAnyMarks = true;
          totalObtained += groupObtained;
          if (groupFailed) hasFailed = true;
        }
      }

      const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;

      let grade = 'N/A';
      if (hasAnyMarks) {
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C+';
        else if (percentage >= 40) grade = 'C';
        else grade = 'D';
      }

      return {
        studentId: student.id,
        rollNo: student.rollNumber,
        studentName: student.name,
        planMarks,
        totalObtained,
        totalFull,
        percentage,
        grade,
        result: !hasAnyMarks ? 'Pending' : hasFailed ? 'Fail' : 'Pass',
        hasReExam,
      };
    });
  }, [selectedPlanTitles, filteredStudents, evalPlanGroups, marksLookup]);

  const togglePlan = (planTitle: string) =>
    setSelectedPlanTitles((prev) =>
      prev.includes(planTitle) ? prev.filter((p) => p !== planTitle) : [...prev, planTitle],
    );

  const toggleExpand = (planTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planTitle)) next.delete(planTitle);
      else next.add(planTitle);
      return next;
    });
  };

  const handleSaveDraft = async () => {
    if (!selectedSubject || !selectedClass || !selectedAcademicYear || selectedTemplateIds.length === 0) {
      toast.error('Please select all filters and at least one evaluation plan');
      return;
    }
    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj) return;
    await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: selectedClass,
      evaluationTemplateIds: selectedTemplateIds,
    });
    toast.success('Draft saved successfully');
  };

  const handleSubmit = async () => {
    if (!selectedSubject || !selectedClass || !selectedAcademicYear || selectedTemplateIds.length === 0) {
      toast.error('Please select all filters and at least one evaluation plan');
      return;
    }
    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj) return;
    const result = await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: selectedClass,
      evaluationTemplateIds: selectedTemplateIds,
    });
    if (result?.id) {
      await submitCompilation.mutateAsync(result.id);
      toast.success('Submitted to admin successfully');
    }
  };

  // Find existing compilation for current selection
  const existingCompilation = useMemo(() => {
    const subjectObj = subjects.find((s) => s.name === selectedSubject);
    if (!subjectObj || !selectedAcademicYear) return null;
    return existingCompilations.find(
      (c) =>
        c.syncedSubjectId === subjectObj.id &&
        c.academicYearId === selectedAcademicYear &&
        c.gradeLevel === selectedClass,
    );
  }, [existingCompilations, selectedSubject, selectedClass, selectedAcademicYear, subjects]);

  const activeGroups = evalPlanGroups.filter((g) => selectedPlanTitles.includes(g.planTitle));

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      key="result-compilation"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Result Compilation</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedSubject
              ? `Compiling results for ${selectedClass} — ${selectedSubject}`
              : 'Select a subject and evaluation plans to compile results'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Exam
            </label>
            <Select
              value={selectedExam}
              onValueChange={(v) => { setSelectedExam(v); setSelectedPlanTitles([]); }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Academic Year
            </label>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select academic year..." />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name} {y.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Existing compilation status */}
      {existingCompilation && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            existingCompilation.status === 'SUBMITTED'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
          )}
        >
          {existingCompilation.status === 'SUBMITTED' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Save className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {existingCompilation.status === 'SUBMITTED' ? 'Submitted to Admin' : 'Draft Saved'}
            </p>
            <p className="text-xs text-muted-foreground">
              Last computed: {new Date(existingCompilation.computedAt).toLocaleDateString()}
              {existingCompilation.submittedAt &&
                ` · Submitted: ${new Date(existingCompilation.submittedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}

      {/* Evaluation Plan Cards */}
      {selectedSubject && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground">
              Select Evaluation Plans
              <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                ({evalPlanGroups.length} plan{evalPlanGroups.length !== 1 ? 's' : ''} available)
              </span>
            </h3>
            <button
              onClick={() => {
                const allPlanTitles = evalPlanGroups.map((g) => g.planTitle);
                setSelectedPlanTitles(
                  allPlanTitles.length === selectedPlanTitles.length ? [] : allPlanTitles,
                );
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {selectedPlanTitles.length === evalPlanGroups.length && evalPlanGroups.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {evalPlanGroups.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground bg-card rounded-xl border border-dashed border-border">
              No evaluation plans found for this subject
              {selectedExam !== 'all' ? ' and exam' : ''}.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evalPlanGroups.map((group) => {
              const isSelected = selectedPlanTitles.includes(group.planTitle);
              const isExpanded = expandedPlans.has(group.planTitle);

              return (
                <div
                  key={group.planTitle}
                  onClick={() => togglePlan(group.planTitle)}
                  className={cn(
                    'bg-card border rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all',
                    isSelected ? 'border-primary ring-2 ring-primary' : 'border-border',
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        )}
                        {!isSelected && (
                          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                          {group.planTitle}
                        </span>
                      </div>
                      {/* Expand/Collapse toggle */}
                      <button
                        onClick={(e) => toggleExpand(group.planTitle, e)}
                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title={isExpanded ? 'Hide outcomes' : 'Show outcomes'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {group.unitTitle && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Unit: {group.unitTitle}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="font-bold text-muted-foreground uppercase block">Max Marks</span>
                        <span className="font-mono font-bold text-foreground">{group.totalFullMarks}</span>
                      </div>
                      <div>
                        <span className="font-bold text-muted-foreground uppercase block">Pass Marks</span>
                        <span className="font-mono font-bold text-foreground">{group.totalPassMarks}</span>
                      </div>
                      <div>
                        <span className="font-bold text-muted-foreground uppercase block">Outcomes</span>
                        <span className="font-mono font-bold text-primary">{group.templates.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-outcomes (expandable) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="outcomes"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="border-t border-border bg-muted/30 px-4 py-3 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            Sub-Learning Outcomes
                          </p>
                          {group.templates.map((t) => {
                            const taskType = getTaskType(t.name);
                            const outcomeText = getOutcomeText(t.name);
                            return (
                              <div
                                key={t.id}
                                className="flex items-start justify-between gap-2 bg-card rounded-lg px-3 py-2 border border-border text-[10px]"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-primary uppercase text-[9px] block">
                                    {taskType}
                                  </span>
                                  <span className="text-foreground font-medium line-clamp-2">
                                    {outcomeText}
                                  </span>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="font-mono font-bold text-foreground block">
                                    {t.fullMarks}
                                  </span>
                                  <span className="text-muted-foreground text-[9px]">
                                    Pass: {t.passMarks}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compiled Results Table */}
      {activeGroups.length > 0 && compiledResults.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">
              Compiled Results ({compiledResults.length} students)
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveDraft}
                disabled={createCompilation.isPending}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitCompilation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {existingCompilation?.status === 'SUBMITTED'
                  ? 'Re-Submit to Admin'
                  : 'Submit to Admin'}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                {/* Row 1 — Plan group headers */}
                <tr className="bg-muted/40">
                  <th
                    className="border border-border px-3 py-2 font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Roll No
                  </th>
                  <th
                    className="border border-border px-3 py-2 font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Student Name
                  </th>
                  {activeGroups.map((g) => (
                    <th
                      key={g.planTitle}
                      className="border border-border px-3 py-2 text-center font-bold text-[11px] text-primary bg-primary/5"
                      colSpan={3}
                    >
                      {g.planTitle}
                      <span className="ml-1 text-[9px] font-normal text-muted-foreground">
                        /{g.totalFullMarks}
                      </span>
                    </th>
                  ))}
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Total
                  </th>
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    %
                  </th>
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Grade
                  </th>
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Result
                  </th>
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Re-Exam
                  </th>
                </tr>
                {/* Row 2 — Per-plan sub-headers */}
                <tr className="bg-muted/20">
                  {activeGroups.map((g) => (
                    <React.Fragment key={g.planTitle}>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        Obtained
                      </th>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        Full
                      </th>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        Status
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compiledResults.map((result) => (
                  <tr key={result.studentId} className="hover:bg-muted/20">
                    <td className="border border-border px-3 py-2 font-mono text-xs text-foreground whitespace-nowrap">
                      {result.rollNo}
                    </td>
                    <td className="border border-border px-3 py-2 text-foreground whitespace-nowrap">
                      {result.studentName}
                    </td>
                    {activeGroups.map((g) => {
                      const pm = result.planMarks[g.planTitle];
                      return (
                        <React.Fragment key={g.planTitle}>
                          <td className="border border-border px-3 py-2 text-center font-mono font-bold text-foreground">
                            {pm?.obtained !== null && pm?.obtained !== undefined
                              ? pm.obtained
                              : '—'}
                          </td>
                          <td className="border border-border px-3 py-2 text-center font-mono text-muted-foreground">
                            {pm?.full}
                          </td>
                          <td className="border border-border px-3 py-2 text-center">
                            {pm?.passed === null ? (
                              <span className="text-muted-foreground text-[10px]">—</span>
                            ) : pm?.passed ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                                Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                                Fail
                              </span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border border-border px-3 py-2 text-center font-semibold text-foreground whitespace-nowrap">
                      {result.totalObtained}/{result.totalFull}
                    </td>
                    <td className="border border-border px-3 py-2 text-center text-foreground">
                      {result.percentage.toFixed(1)}%
                    </td>
                    <td className="border border-border px-3 py-2 text-center font-semibold text-foreground">
                      {result.grade}
                    </td>
                    <td
                      className={cn(
                        'border border-border px-3 py-2 text-center font-bold',
                        result.result === 'Pass'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : result.result === 'Fail'
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                      )}
                    >
                      {result.result}
                    </td>
                    <td className="border border-border px-3 py-2 text-center">
                      {result.hasReExam && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Re-Exam
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
