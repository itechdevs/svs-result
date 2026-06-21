"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus, Trash2, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExams, useCreateExam, useDeleteExam } from "@/hooks/use-exams";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useGradeLevels } from "@/hooks/use-subjects";
import SanskarLoader from "@/components/shared/SanskarLoader";

export default function ExamsPage() {
  const router = useRouter();
  const { data: exams, isLoading } = useExams();
  const { data: academicYears } = useAcademicYears();
  const { data: gradeLevels } = useGradeLevels();
  const createExam = useCreateExam();
  const deleteExam = useDeleteExam();

  const currentYear = academicYears?.find((y: any) => y.isCurrent);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setGradeLevel("");
    setAcademicYearId("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreate = async () => {
    const yearId = academicYearId || currentYear?.id;
    if (!yearId) {
      alert("No academic year selected. Please select one first.");
      return;
    }
    try {
      const result = await createExam.mutateAsync({
        name,
        description: description || undefined,
        academicYearId: yearId,
        gradeLevel,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      resetForm();
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create exam");
    }
  };

  if (isLoading) {
    return <SanskarLoader message="Loading exams..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Exam Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage exam groupings across subjects
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
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
                <Select
                  value={academicYearId}
                  onValueChange={setAcademicYearId}
                  defaultValue={currentYear?.id}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears?.map((year: any) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.isCurrent && "(Current)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  Grade Level
                </label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade level" />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !name || !(academicYearId || currentYear) || !gradeLevel || createExam.isPending
                }
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                {createExam.isPending ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {exams && exams.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade Level</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead className="text-center">Evaluations</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow
                  key={exam.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/admin/exams/${exam.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      {exam.name}
                    </div>
                  </TableCell>
                  <TableCell>{exam.gradeLevel}</TableCell>
                  <TableCell>{exam.academicYear?.name}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {exam._count?.evaluationTemplates ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {exam.startDate ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.startDate).toLocaleDateString()}
                        {exam.endDate && (
                          <> — {new Date(exam.endDate).toLocaleDateString()}</>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{exam.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteExam.mutateAsync(exam.id)}
                              className="bg-destructive text-destructive-foreground text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No exams yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Create your first exam to get started
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
