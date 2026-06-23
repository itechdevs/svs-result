"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { BSCalendarSelector } from "@/components/shared/ui/bs-calendar-selector";
import { formatToBSFullString } from "@/lib/bs-calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shared/ui/alert-dialog";
import { useExam, useUpdateExam, useDeleteExam } from "@/hooks/use-exams";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useSubjects, useGradeLevels } from "@/hooks/use-subjects";
import SanskarLoader from "@/components/shared/SanskarLoader";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import ExamResultCompilation from "@/components/admin/ExamResultCompilation";
import { toast } from "sonner";

interface Props {
  examId: string;
}

export default function ExamDetailClient({ examId }: Props) {
  const router = useRouter();
  const { data: exam, isLoading, error } = useExam(examId);
  const { data: academicYears } = useAcademicYears();
  const { data: gradeLevels } = useGradeLevels();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'compilation'>('overview');

  // Templates linked to this exam
  const linkedTemplates = useMemo(
    () => exam?.evaluationTemplates ?? [],
    [exam],
  );

  // All subjects for this exam's grade level
  const { data: allGradeSubjects = [] } = useSubjects({
    gradeLevel: exam?.gradeLevel,
    isActive: true,
  });

  // Subjects table: all grade-level subjects, enriched with linked templates
  const examSubjects = useMemo(() => {
    const templateMap = new Map<string, typeof linkedTemplates>();
    for (const t of linkedTemplates) {
      if (!t.syncedSubject) continue;
      const sid = t.syncedSubject.id;
      if (!templateMap.has(sid)) templateMap.set(sid, []);
      templateMap.get(sid)!.push(t);
    }
    return allGradeSubjects.map((s) => {
      const templates = templateMap.get(s.id) ?? [];
      const totalWeightage = templates.reduce((sum, t) => sum + Number(t.weightage), 0);
      return { id: s.id, name: s.name, code: s.code, templates, totalWeightage };
    });
  }, [linkedTemplates, allGradeSubjects]);

  // Stats
  const totalWeightage = useMemo(
    () => linkedTemplates.reduce((sum, t) => sum + Number(t.weightage), 0),
    [linkedTemplates],
  );
  const daysRemaining = useMemo(() => {
    if (!exam?.endDate) return null;
    const end = new Date(exam.endDate);
    const now = new Date();
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  }, [exam?.endDate]);

  const openEditDialog = useCallback(() => {
    if (!exam) return;
    setName(exam.name);
    setDescription(exam.description || "");
    setGradeLevel(exam.gradeLevel);
    setAcademicYearId(exam.academicYearId);
    setStartDate(exam.startDate || "");
    setEndDate(exam.endDate || "");
    setEditOpen(true);
  }, [exam]);

  const handleUpdate = async () => {
    if (!exam) return;
    try {
      await updateExam.mutateAsync({
        id: exam.id,
        data: {
          name,
          description: description || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setEditOpen(false);
      toast.success("Exam updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update exam");
    }
  };

  const handleDelete = async () => {
    if (!exam) return;
    try {
      await deleteExam.mutateAsync(exam.id);
      toast.success("Exam deleted successfully");
      router.push(ROUTES.ADMIN_EXAMS);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete exam");
    }
  };

  if (isLoading) {
    return <SanskarLoader message="Loading exam details..." />;
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-destructive mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Exam not found or failed to load.
        </p>
        <Link
          href={ROUTES.ADMIN_EXAMS}
          className="mt-4 text-xs font-semibold text-primary hover:underline"
        >
          ← Back to Exams
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <div className="space-y-4">
        <Link
          href={ROUTES.ADMIN_EXAMS}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Exams
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {exam.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${exam.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                  }`}
              >
                {exam.isActive ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <ExamResultCompilation
                    examId={examId}
                    examName={exam.name}
                    gradeLevel={exam.gradeLevel}
                    academicYearId={exam.academicYearId}
                    linkedTemplates={linkedTemplates}
                  />
                )}
                {exam.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {exam.gradeLevel}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {exam.academicYear?.name}
              </span>
              {exam.startDate && (
                <span className="flex items-center gap-1.5 text-xs">
                  <Calendar className="w-3 h-3" />
                  {formatToBSFullString(exam.startDate)}
                  {exam.endDate && (
                    <> — {formatToBSFullString(exam.endDate)}</>
                  )}
                </span>
              )}
            </div>
            {exam.description && (
              <p className="text-sm text-muted-foreground/70 max-w-xl">
                {exam.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={openEditDialog}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex items-center gap-1 border-b border-border pb-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2.5 text-xs font-bold transition-colors rounded-t-lg border-b-2",
            activeTab === 'overview'
              ? "border-primary text-foreground bg-card"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('compilation')}
          className={cn(
            "px-4 py-2.5 text-xs font-bold transition-colors rounded-t-lg border-b-2",
            activeTab === 'compilation'
              ? "border-primary text-foreground bg-card"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Result Compilation
        </button>
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'overview' && (
        <>
          {/* ─── Summary Stats ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Subjects"
              value={String(allGradeSubjects.length)}
              sub="For this grade level"
              icon={<BookOpen className="w-4 h-4" />}
              colorClass="text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-900/30"
            />
            <StatCard
              label="Evaluations"
              value={String(linkedTemplates.length)}
              sub="Templates linked"
              icon={<FileText className="w-4 h-4" />}
              colorClass="text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
            />
            <StatCard
              label="Weightage"
              value={`${totalWeightage}%`}
              sub="Total allocated"
              icon={<CheckCircle2 className="w-4 h-4" />}
              colorClass="text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
            />
            <StatCard
              label="Days Left"
              value={
                daysRemaining !== null
                  ? daysRemaining > 0
                    ? String(daysRemaining)
                    : "Ended"
                  : "—"
              }
              sub={
                daysRemaining !== null
                  ? daysRemaining > 0
                    ? "Until end date"
                    : "Exam period ended"
                  : "No end date set"
              }
              icon={<Clock className="w-4 h-4" />}
              colorClass={
                daysRemaining !== null && daysRemaining <= 7
                  ? "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
                  : "text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/30"
              }
            />
          </div>

          {/* ─── Subjects Table ─── */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                Exam Subjects
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {examSubjects.length} subject(s) — teachers create
                evaluations for these subjects
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Evaluations</TableHead>
                    <TableHead className="text-center">Weightage</TableHead>
                    <TableHead>Evaluations Breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {subject.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1.5">
                              {subject.code}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {subject.templates.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${subject.totalWeightage >= 100
                              ? "bg-emerald-100 text-emerald-700"
                              : subject.totalWeightage >= 80
                                ? "bg-amber-100 text-amber-700"
                                : "bg-primary/10 text-primary"
                            }`}
                        >
                          {subject.totalWeightage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {subject.templates.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full"
                            >
                              {t.name}
                              <span className="text-foreground/60">
                                {Number(t.weightage)}%
                              </span>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ─── Weightage Per Subject ─── */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                Subject Weightage Breakdown
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each subject's evaluations must sum to 100% weightage
              </p>
            </div>
            <div className="p-5 space-y-4">
              {examSubjects.map((subject) => {
                const pct = subject.totalWeightage;
                const remaining = 100 - pct;
                const barColor =
                  pct >= 100
                    ? "bg-emerald-500"
                    : pct >= 80
                      ? "bg-amber-500"
                      : "bg-primary";
                return (
                  <div
                    key={subject.id}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">
                          {subject.name}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {subject.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-foreground">
                          {pct}% allocated
                        </span>
                        <span
                          className={
                            remaining === 0
                              ? "text-emerald-600 font-semibold"
                              : "text-muted-foreground"
                          }
                        >
                          {remaining}% remaining
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {subject.templates.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full"
                        >
                          {t.name}
                          <span className="text-foreground/60">
                            {Number(t.weightage)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {activeTab === 'compilation' && (
        <ExamResultCompilation
          examId={examId}
          examName={exam.name}
          gradeLevel={exam.gradeLevel}
          academicYearId={exam.academicYearId}
          linkedTemplates={linkedTemplates}
        />
      )}

      {/* ─── Edit Dialog ─── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Exam Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mid-Term Exam"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Academic Year
              </label>
              <Select value={academicYearId} onValueChange={() => { }} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((year: any) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Grade Level
              </label>
              <Select value={gradeLevel} onValueChange={() => { }} disabled>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels?.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  Start Date
                </label>
                <BSCalendarSelector value={startDate} onChange={setStartDate} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  End Date
                </label>
                <BSCalendarSelector value={endDate} onChange={setEndDate} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!name || updateExam.isPending}
              className="bg-primary text-primary-foreground text-xs font-bold"
            >
              {updateExam.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{exam.name}"? This will mark the
              exam as inactive. Subject groupings will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground text-xs"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </motion.div>
  );
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  sub,
  icon,
  colorClass,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-2xl font-extrabold text-foreground">{value}</p>
        </div>
        <div className={`p-2 rounded-xl ${colorClass}`}>{icon}</div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">{sub}</p>
    </div>
  );
}
