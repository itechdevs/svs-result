'use client';
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckCircle,
  Save,
  Send,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatNum, formatPct } from '@/lib/format-num';
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
import {
  getEvaluationGroupKey,
  parseEvaluationName,
} from '@/lib/evaluation-grouping';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalPlanGroup {
  /** Stable identity: gradeConfig + subject + exam + title + unit + batch */
  key: string;
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
  planMarks: Record<string, { obtained: number | null; full: number; passed: boolean | null; percentage: number | null }>;
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
  const { evalTitle, unitTitle } = parseEvaluationName(name);
  if (evalTitle) {
    return { planTitle: evalTitle, unitTitle };
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
  const selectedSection = searchParams.get('section') ?? '';
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const classQuery = selectedSection
    ? `${selectedClass} - ${selectedSection}`
    : selectedClass;
  // Selected plan keys (stable group identity, not template IDs or titles)
  const [selectedPlanKeys, setSelectedPlanKeys] = useState<string[]>([]);
  // Expanded plan keys (for showing sub-outcomes)
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
      setSelectedExam('');
      setSelectedPlanKeys([]);
    }
  }, [selectedAcademicYear]);

  const { data: allExams = [] } = useExams(
    selectedAcademicYear
      ? { academicYearId: selectedAcademicYear }
      : undefined,
  );

  // Match exams whose gradeLevel equals the classroom name.
  // SyncedSubject stores gradeLevel="Penguin" section="A" (split),
  // but Exam.gradeLevel stores the SyncedClassroom.name e.g. "Penguin - A" or "Penguin A".
  // Try exact match first, then combined variants.
  const exams = useMemo(() => {
    if (!selectedClass) return allExams;
    return allExams.filter((exam) => {
      const g = exam.gradeLevel;
      if (g === selectedClass) return true;
      if (selectedSection) {
        if (g === `${selectedClass} - ${selectedSection}`) return true;
        if (g === `${selectedClass} ${selectedSection}`) return true;
        if (g === `${selectedClass}-${selectedSection}`) return true;
      }
      return false;
    });
  }, [allExams, selectedClass, selectedSection]);
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 5000 });
  const { data: studentsData } = useStudents(
    selectedClass ? { class: classQuery, limit: 9999 } : { limit: 1 },
  );

  const { data: existingCompilations = [] } = useTeacherSubjectCompilations({
    academicYearId: selectedAcademicYear || undefined,
    gradeLevel: classQuery || undefined,
    examId: selectedExam || undefined,
  });

  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  // Assigned subjects from teacher profile
  const subjects = useMemo(() => {
    const teacherSubjects = profile?.syncedTeacher?.subjects ?? [];
    return teacherSubjects
      .filter((s) => s.gradeLevel === selectedClass)
      .map((s) => ({ id: s.id, name: s.name, gradeLevel: s.gradeLevel, section: s.section }));
  }, [profile, selectedClass]);

  // Resolve the exact subject record (with ID) matching class + name + section.
  // This mirrors the logic in MarkEntryOverviewTable and prevents merging
  // templates from different SyncedSubject records (e.g. different sections).
  const subjectObj = useMemo(() => {
    if (!selectedSubject) return undefined;
    return subjects.find(
      (s) =>
        s.name === selectedSubject &&
        (selectedSection ? s.section === selectedSection : true),
    );
  }, [subjects, selectedSubject, selectedSection]);

  const { data: templatesData = [] } = useEvaluationTemplates(
    selectedAcademicYear || subjectObj
      ? {
          academicYearId: selectedAcademicYear || undefined,
          ...(subjectObj?.id && { syncedSubjectId: subjectObj.id }),
        }
      : {},
  );

  // Filtered templates for the exact subject record (by database ID, not by name).
  // This matches the marks entry page logic and excludes templates from
  // other sections or duplicate subject records that share the same name.
  const filteredTemplates = useMemo(() => {
    if (!subjectObj) return [];
    return templatesData.filter((t) => {
      if (t.syncedSubjectId !== subjectObj.id) return false;
      if (!t.isActive) return false;
      if (selectedExam) {
        return t.examId === selectedExam || !t.examId;
      }
      return true;
    });
  }, [templatesData, subjectObj, selectedExam]);

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

  // Group templates by evaluation plan (full plan identity: subject + exam +
  // title + unit + batch — so a fresh evaluation saved with the same title
  // appears as its own selectable plan instead of merging).
  const evalPlanGroups = useMemo((): EvalPlanGroup[] => {
    const map = new Map<string, EvalPlanGroup>();
    for (const t of filteredTemplates) {
      const { planTitle, unitTitle } = getPlanTitle(t.name, selectedSubject);
      // Full grouping key prevents merging distinct plans that share the
      // same visible title (different term/unit, or a fresh re-save).
      const compositeKey = getEvaluationGroupKey(t);
      if (!map.has(compositeKey)) {
        map.set(compositeKey, {
          key: compositeKey,
          planTitle,
          unitTitle,
          templates: [],
          totalFullMarks: 0,
          totalPassMarks: 0,
        });
      }
      const group = map.get(compositeKey)!;
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

  // Log evaluation plan details for debugging
  useEffect(() => {
    if (evalPlanGroups.length > 0) {
      console.debug('[ResultCompilation] Evaluation Plan Groups:', evalPlanGroups.map((g) => ({
        planTitle: g.planTitle,
        unitTitle: g.unitTitle,
        templateCount: g.templates.length,
        totalFullMarks: g.totalFullMarks,
        totalPassMarks: g.totalPassMarks,
        templates: g.templates.map((t) => ({
          id: t.id,
          name: t.name,
          syncedSubjectId: t.syncedSubjectId,
          fullMarks: Number(t.fullMarks),
          passMarks: Number(t.passMarks),
        })),
      })));
    }
  }, [evalPlanGroups]);

  // All template IDs from selected plans
  const selectedTemplateIds = useMemo(() => {
    const ids: string[] = [];
    for (const group of evalPlanGroups) {
      if (selectedPlanKeys.includes(group.key)) {
        group.templates.forEach((t) => ids.push(t.id));
      }
    }
    return ids;
  }, [evalPlanGroups, selectedPlanKeys]);

  // Students for selected class
  const filteredStudents = useMemo(
    () => students.filter((s) => s.class === classQuery),
    [students, classQuery],
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
    if (selectedPlanKeys.length === 0 || filteredStudents.length === 0) return [];

    const selectedGroups = evalPlanGroups.filter((g) =>
      selectedPlanKeys.includes(g.key),
    );

    return filteredStudents.map((student) => {
      const planMarks: CompiledStudentResult['planMarks'] = {};
      let totalObtained = 0;
      let totalFull = 0;
      let hasAnyMarks = false;
      let hasFailed = false;
      let hasReExam = false;
      let sumOfPercentages = 0;
      let validPlanCount = 0;

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

        const planPct = groupHasMarks && group.totalFullMarks > 0
          ? (groupObtained / group.totalFullMarks) * 100
          : null;

        planMarks[group.key] = {
          obtained: groupHasMarks ? groupObtained : null,
          full: group.totalFullMarks,
          passed: groupHasMarks ? !groupFailed : null,
          percentage: planPct,
        };

        totalFull += groupFull;
        if (groupHasMarks) {
          hasAnyMarks = true;
          totalObtained += groupObtained;
          if (groupFailed) hasFailed = true;
          
          const planPercentage = group.totalFullMarks > 0 ? (groupObtained / group.totalFullMarks) * 100 : 0;
          sumOfPercentages += planPercentage;
          validPlanCount++;
        }
      }

      const percentage = validPlanCount > 0 ? sumOfPercentages / validPlanCount : 0;

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
  }, [selectedPlanKeys, filteredStudents, evalPlanGroups, marksLookup]);

  const togglePlan = (planKey: string) =>
    setSelectedPlanKeys((prev) =>
      prev.includes(planKey) ? prev.filter((p) => p !== planKey) : [...prev, planKey],
    );

  const toggleExpand = (planKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedPlans((prev) => {
      const next = new Set(prev);
      if (next.has(planKey)) next.delete(planKey);
      else next.add(planKey);
      return next;
    });
  };

  const handleSaveDraft = async () => {
    if (!subjectObj || !selectedClass || !selectedAcademicYear || !selectedExam || selectedTemplateIds.length === 0) {
      toast.error('Please select exam, academic year, and at least one evaluation plan');
      return;
    }
    await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: classQuery,
      examId: selectedExam,
      evaluationTemplateIds: selectedTemplateIds,
    });
    toast.success('Draft saved successfully');
  };

  const handleSubmit = async () => {
    if (!subjectObj || !selectedClass || !selectedAcademicYear || !selectedExam || selectedTemplateIds.length === 0) {
      toast.error('Please select exam, academic year, and at least one evaluation plan');
      return;
    }
    const result = await createCompilation.mutateAsync({
      syncedSubjectId: subjectObj.id,
      academicYearId: selectedAcademicYear,
      gradeLevel: classQuery,
      examId: selectedExam,
      evaluationTemplateIds: selectedTemplateIds,
    });
    if (result?.id) {
      await submitCompilation.mutateAsync(result.id);
      toast.success('Submitted to admin successfully');
    }
  };

  // Find existing compilation for current selection (including exam)
  const existingCompilation = useMemo(() => {
    if (!subjectObj || !selectedAcademicYear || !selectedExam) return null;
    return existingCompilations.find(
      (c) =>
        c.syncedSubjectId === subjectObj.id &&
        c.academicYearId === selectedAcademicYear &&
        c.gradeLevel === classQuery &&
        (c as any).examId === selectedExam,
    );
  }, [existingCompilations, subjectObj, classQuery, selectedAcademicYear, selectedExam]);

  const activeGroups = evalPlanGroups.filter((g) => selectedPlanKeys.includes(g.key));

  // Titles shared by more than one plan (same visible title, distinct
  // term/unit/save) — those headers/cards get a unit suffix so teachers can
  // tell the fresh evaluation apart from the previous one.
  const duplicateTitles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of evalPlanGroups) counts.set(g.planTitle, (counts.get(g.planTitle) ?? 0) + 1);
    return new Set(
      [...counts.entries()].filter(([, n]) => n > 1).map(([t]) => t),
    );
  }, [evalPlanGroups]);

  const groupLabel = (g: EvalPlanGroup) =>
    duplicateTitles.has(g.planTitle) && g.unitTitle
      ? `${g.planTitle} (${g.unitTitle})`
      : g.planTitle;

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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Result Compilation</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedSubject
              ? `Compiling results for ${selectedClass} — ${selectedSubject}`
              : 'Select a subject and evaluation plans to compile results'}
          </p>
        </div>
      </div>

      {/* Observation reminder banner — only visible to class teachers */}
      {profile?.syncedTeacher?.classTeacherId && selectedExam && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Observation entry available
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              As a class teacher of{' '}
              <span className="font-bold">{profile.syncedTeacher.classTeacherClassName}</span>,
              you can enter observations for each student for this exam. The admin will
              include these when generating grade sheets.
            </p>
          </div>
          <Link
            href="/teacher/observations"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
          >
            Enter Observations
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Exam
            </label>
            <Select
              value={selectedExam}
              onValueChange={(v) => { setSelectedExam(v); setSelectedPlanKeys([]); }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select exam..." />
              </SelectTrigger>
              <SelectContent>
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
      {selectedSubject && selectedAcademicYear && selectedExam && (
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
                const allPlanKeys = evalPlanGroups.map((g) => g.key);
                setSelectedPlanKeys(
                  allPlanKeys.length === selectedPlanKeys.length ? [] : allPlanKeys,
                );
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {selectedPlanKeys.length === evalPlanGroups.length && evalPlanGroups.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>

          {evalPlanGroups.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground bg-card rounded-xl border border-dashed border-border">
              No evaluation plans found for this subject and exam.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {evalPlanGroups.map((group) => {
              const isSelected = selectedPlanKeys.includes(group.key);
              const isExpanded = expandedPlans.has(group.key);

              return (
                <div
                  key={group.key}
                  onClick={() => togglePlan(group.key)}
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
                          {groupLabel(group)}
                        </span>
                      </div>
                      {/* Expand/Collapse toggle */}
                      <button
                        onClick={(e) => toggleExpand(group.key, e)}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Compiled Results ({compiledResults.length} students)
              </h3>
              {profile?.syncedTeacher?.classTeacherId && (
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" />
                  Remember to also fill{' '}
                  <Link href="/teacher/observations" className="text-primary underline font-semibold">
                    observations
                  </Link>{' '}
                  for this class.
                </p>
              )}
            </div>
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
                  ? 'Re-Submit'
                  : 'Submit'}
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
                      key={g.key}
                      className="border border-border px-3 py-2 text-center font-bold text-[11px] text-primary bg-primary/5"
                      colSpan={3}
                    >
                      {groupLabel(g)}
                    </th>
                  ))}
                  {/* No Total column header */}
                  <th
                    className="border border-border px-3 py-2 text-center font-bold text-foreground text-[11px]"
                    rowSpan={2}
                  >
                    Avg %
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
                    <React.Fragment key={g.key}>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        Obtained
                      </th>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        Full
                      </th>
                      <th className="border border-border px-3 py-1.5 text-center text-[9px] font-bold text-muted-foreground uppercase">
                        %
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
                      const pm = result.planMarks[g.key];
                      return (
                        <React.Fragment key={g.key}>
                          <td className="border border-border px-3 py-2 text-center font-mono font-bold text-foreground">
                            {pm?.obtained !== null && pm?.obtained !== undefined
                              ? formatNum(pm.obtained, 2)
                              : '—'}
                          </td>
                          <td className="border border-border px-3 py-2 text-center font-mono text-muted-foreground">
                            {pm?.full}
                          </td>
                          <td className="border border-border px-3 py-2 text-center font-mono text-foreground">
                            {pm?.percentage !== null && pm?.percentage !== undefined
                              ? formatPct(pm.percentage, 2)
                              : '—'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="border border-border px-3 py-2 text-center text-foreground font-semibold">
                      {formatPct(result.percentage, 2)}
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
