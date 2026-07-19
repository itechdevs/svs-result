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
import { useGradeLevels } from "@/hooks/use-subjects";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import SanskarLoader from "@/components/shared/SanskarLoader";
import { ROUTES } from "@/lib/constants";
import ExamResultCompilation from "@/components/admin/ExamResultCompilation";
import { toast } from "sonner";

type SchoolLevel = "PRE_PRIMARY" | "PRIMARY" | "SECONDARY" | "HIGHER";

interface Props {
  examId: string;
}

export default function ExamDetailClient({ examId }: Props) {
  const router = useRouter();
  const { data: exam, isLoading, error } = useExam(examId);
  const { data: academicYears } = useAcademicYears();
  const { data: gradeLevels } = useGradeLevels();
  const { data: categories } = useGradeLevelCategories();
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

  // Templates linked to this exam
  const linkedTemplates = useMemo(
    () => exam?.evaluationTemplates ?? [],
    [exam],
  );

  // Determine school level for this exam's grade level
  const schoolLevel = useMemo((): SchoolLevel | null => {
    if (!exam?.gradeLevel) return null;
    const dbMap = new Map<string, string>();
    for (const c of categories ?? []) {
      dbMap.set(c.gradeLevel, c.schoolLevel);
    }
    const level = (dbMap.get(exam.gradeLevel) ?? "PRIMARY") as SchoolLevel;
    return level === "HIGHER" ? "SECONDARY" : level;
  }, [exam?.gradeLevel, categories]);

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
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  exam.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
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
                  {exam.endDate && <> — {formatToBSFullString(exam.endDate)}</>}
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

      {/* ─── Result Compilation ─── */}
      <ExamResultCompilation
        examId={examId}
        examName={exam.name}
        gradeLevel={exam.gradeLevel}
        academicYearId={exam.academicYearId}
        linkedTemplates={linkedTemplates}
        schoolLevel={schoolLevel}
      />

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
              <Select value={academicYearId} onValueChange={() => {}} disabled>
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
              <Select value={gradeLevel} onValueChange={() => {}}>
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
