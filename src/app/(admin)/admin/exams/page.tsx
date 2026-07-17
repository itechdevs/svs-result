"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BSCalendarSelector } from "@/components/shared/ui/bs-calendar-selector";
import { formatToBSFullString } from "@/lib/bs-calendar";
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
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shared/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
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
import {
  useExams,
  useCreateExam,
  useUpdateExam,
  useDeleteExam,
} from "@/hooks/use-exams";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useGradeLevelsWithSection } from "@/hooks/use-subjects";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import SanskarLoader from "@/components/shared/SanskarLoader";

export default function ExamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise from URL — pre-selects when coming from /admin/academic-years row click
  const [academicYearFilter, setAcademicYearFilter] = useState(
    () => searchParams.get("academicYearId") ?? "",
  );
  const [gradeLevelFilter, setGradeLevelFilter] = useState("");
  // Category filter driven by ?category= param (PRE_PRIMARY | PRIMARY | SECONDARY | HIGHER)
  const [categoryFilter, setCategoryFilter] = useState(
    () => searchParams.get("category") ?? "",
  );

  // Stay in sync when browser navigates back/forward
  useEffect(() => {
    setAcademicYearFilter(searchParams.get("academicYearId") ?? "");
    setCategoryFilter(searchParams.get("category") ?? "");
  }, [searchParams]);

  const { data: exams, isLoading } = useExams({
    ...(academicYearFilter && { academicYearId: academicYearFilter }),
    ...(gradeLevelFilter && { gradeLevel: gradeLevelFilter }),
  });
  const { data: academicYears } = useAcademicYears();
  const { data: gradeLevels, isLoading: isLoadingGrades } =
    useGradeLevelsWithSection();
  const { data: gradeLevelCategories } = useGradeLevelCategories();
  const createExam = useCreateExam();
  const deleteExam = useDeleteExam();
  const updateExam = useUpdateExam();

  // Build a gradeLevel → schoolLevel lookup map from the DB categories
  const gradeLevelToSchoolLevel = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of gradeLevelCategories ?? []) {
      map.set(c.gradeLevel, c.schoolLevel);
    }
    return map;
  }, [gradeLevelCategories]);

  // Apply category filter on top of the already-fetched exams (data-driven, not hardcoded)
  const filteredExams = useMemo(() => {
    if (!exams) return [];
    if (!categoryFilter) return exams;
    return exams.filter((exam) => {
      const level = gradeLevelToSchoolLevel.get(exam.gradeLevel);
      return level === categoryFilter;
    });
  }, [exams, categoryFilter, gradeLevelToSchoolLevel]);

  // Group grade levels by DB-driven categories
  // gradeLevels is now GradeLevelWithSection[] — gradeLevel field is the SyncedClassroom.name
  // which matches GradeLevelCategory keys exactly.
  const groupedGrades = useMemo(() => {
    if (!gradeLevels) return null;
    type GradeItem = {
      gradeLevel: string;
      section: string;
      displayName: string;
    };
    const groups: Record<string, GradeItem[]> = {
      PRE_PRIMARY: [],
      PRIMARY: [],
      SECONDARY: [],
      HIGHER: [],
    };
    // dedupe by gradeLevel (classroom name is already unique per section)
    const seen = new Set<string>();
    gradeLevels.forEach((item) => {
      if (seen.has(item.gradeLevel)) return;
      seen.add(item.gradeLevel);
      const cat = gradeLevelToSchoolLevel.get(item.gradeLevel) ?? "PRIMARY";
      groups[cat].push(item);
    });
    return groups;
  }, [gradeLevels, gradeLevelToSchoolLevel]);

  // Map gradeLevel → displayName for the trigger button label
  const gradeLevelDisplayMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of gradeLevels ?? []) {
      map.set(item.gradeLevel, item.displayName);
    }
    return map;
  }, [gradeLevels]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [gradeLevel, setGradeLevel] = useState(""); // Used for edit
  const [academicYearId, setAcademicYearId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setGradeLevel("");
    setSelectedGrades([]);

    // Auto-select academic year if today falls within its date range
    if (academicYears && academicYears.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeYear = academicYears.find((y: any) => {
        if (!y.startDate || !y.endDate) return false;
        const start = new Date(y.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(y.endDate);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      });
      setAcademicYearId(activeYear ? activeYear.id : "");
    } else {
      setAcademicYearId("");
    }

    setStartDate("");
    setEndDate("");
  };

  const handleCreate = async () => {
    const yearId = academicYearId;
    if (!yearId) {
      toast.error("No academic year selected. Please select one first.");
      return;
    }
    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade level.");
      return;
    }

    try {
      await Promise.all(
        selectedGrades.map((grade) =>
          createExam.mutateAsync({
            name,
            description: description || undefined,
            academicYearId: yearId,
            gradeLevel: grade,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
        ),
      );

      resetForm();
      setOpen(false);
      toast.success(`Successfully created ${selectedGrades.length} exam(s)`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create exams");
    }
  };

  const openEditDialog = (exam: any) => {
    setEditingExam(exam);
    setName(exam.name);
    setDescription(exam.description || "");
    setGradeLevel(exam.gradeLevel);
    setAcademicYearId(exam.academicYearId);
    setStartDate(exam.startDate || "");
    setEndDate(exam.endDate || "");
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingExam) return;
    try {
      await updateExam.mutateAsync({
        id: editingExam.id,
        data: {
          name,
          description: description || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });

      resetForm();
      setEditOpen(false);
      setEditingExam(null);
      toast.success("Exam updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update exam");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExam.mutateAsync(id);
      toast.success("Exam deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete exam");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {categoryFilter
              ? `${categoryFilter === "PRE_PRIMARY" ? "Pre-Primary" : categoryFilter === "PRIMARY" ? "Primary" : categoryFilter === "SECONDARY" ? "Secondary" : categoryFilter} — Evaluation Plans`
              : "Exam Plans"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {categoryFilter
              ? `Showing Evaluation Plans for the ${categoryFilter === "PRE_PRIMARY" ? "Pre-Primary" : categoryFilter === "PRIMARY" ? "Primary" : "Secondary"} category`
              : "Create and manage exam groupings across subjects"}
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(val) => {
            if (val) resetForm();
            setOpen(val);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[500px]"
            aria-describedby={undefined}
          >
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
                  Grade Levels
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal px-3"
                      disabled={isLoadingGrades || !gradeLevels}
                    >
                      <div className="flex gap-1 overflow-hidden truncate">
                        {isLoadingGrades ? (
                          <span className="text-muted-foreground">
                            Loading grades...
                          </span>
                        ) : selectedGrades.length === 0 ? (
                          <span className="text-muted-foreground">
                            Select grade levels...
                          </span>
                        ) : selectedGrades.length <= 3 ? (
                          <span className="text-foreground">
                            {selectedGrades
                              .map((g) => gradeLevelDisplayMap.get(g) ?? g)
                              .join(", ")}
                          </span>
                        ) : (
                          <span className="text-foreground">
                            {selectedGrades.length} grades selected
                          </span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[400px] overflow-y-auto"
                  >
                    {(() => {
                      // When a category filter is active, only show grades for that category.
                      // Otherwise show all categories.
                      const categoryLabels: Record<string, string> = {
                        PRE_PRIMARY: "Pre-Primary",
                        PRIMARY: "Primary",
                        SECONDARY: "Secondary",
                        HIGHER: "Higher",
                      };

                      const categoriesToShow = categoryFilter
                        ? [categoryFilter]
                        : ["PRE_PRIMARY", "PRIMARY", "SECONDARY", "HIGHER"];

                      // Grades visible in the dropdown (respects category filter)
                      const visibleGrades = groupedGrades
                        ? categoriesToShow.flatMap(
                            (cat) => groupedGrades[cat] ?? [],
                          )
                        : (gradeLevels ?? []);

                      const allVisibleSelected =
                        visibleGrades.length > 0 &&
                        visibleGrades.every((g) =>
                          selectedGrades.includes(g.gradeLevel),
                        );

                      return (
                        <>
                          {/* Select / Unselect All (scoped to visible grades) */}
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              if (allVisibleSelected) {
                                setSelectedGrades((prev) =>
                                  prev.filter(
                                    (g) =>
                                      !visibleGrades.some(
                                        (vg) => vg.gradeLevel === g,
                                      ),
                                  ),
                                );
                              } else {
                                setSelectedGrades((prev) => [
                                  ...new Set([
                                    ...prev,
                                    ...visibleGrades.map((vg) => vg.gradeLevel),
                                  ]),
                                ]);
                              }
                            }}
                            className="font-semibold"
                          >
                            <div
                              className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors ${
                                allVisibleSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              }`}
                            >
                              {allVisibleSelected && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            {allVisibleSelected ? "Unselect All" : "Select All"}
                          </DropdownMenuItem>

                          {groupedGrades &&
                            categoriesToShow.map((cat) => {
                              const items = groupedGrades[cat] ?? [];
                              if (items.length === 0) return null;
                              return (
                                <span key={cat}>
                                  <div className="h-px bg-border my-1 mx-1" />
                                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {categoryLabels[cat]}
                                  </div>
                                  {items.map((item) => {
                                    const isChecked = selectedGrades.includes(
                                      item.gradeLevel,
                                    );
                                    return (
                                      <DropdownMenuItem
                                        key={item.gradeLevel}
                                        onSelect={(e) => {
                                          e.preventDefault();
                                          if (isChecked) {
                                            setSelectedGrades((prev) =>
                                              prev.filter(
                                                (g) => g !== item.gradeLevel,
                                              ),
                                            );
                                          } else {
                                            setSelectedGrades((prev) => [
                                              ...prev,
                                              item.gradeLevel,
                                            ]);
                                          }
                                        }}
                                      >
                                        <div
                                          className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary transition-colors ${
                                            isChecked
                                              ? "bg-primary text-primary-foreground"
                                              : "opacity-50"
                                          }`}
                                        >
                                          {isChecked && (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </div>
                                        <span>{item.displayName}</span>
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </span>
                              );
                            })}
                        </>
                      );
                    })()}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    Start Date
                  </label>
                  <BSCalendarSelector
                    value={startDate}
                    onChange={setStartDate}
                  />
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
                  !name ||
                  !academicYearId ||
                  selectedGrades.length === 0 ||
                  createExam.isPending
                }
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                {createExam.isPending ? "Creating..." : "Create Exam"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent
            className="sm:max-w-[500px]"
            aria-describedby={undefined}
          >
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
                <Select
                  value={academicYearId}
                  onValueChange={setAcademicYearId}
                  disabled
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
                <Select
                  value={gradeLevel}
                  onValueChange={setGradeLevel}
                  disabled
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels?.map((item) => (
                      <SelectItem key={item.gradeLevel} value={item.gradeLevel}>
                        {item.gradeLevel} {item.sectionName}
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
                  <BSCalendarSelector
                    value={startDate}
                    onChange={setStartDate}
                  />
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
                onClick={() => {
                  resetForm();
                  setEditOpen(false);
                  setEditingExam(null);
                }}
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
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Academic Year Filter */}
          <div className="w-full sm:w-60">
            <Select
              value={academicYearFilter}
              onValueChange={(val) =>
                setAcademicYearFilter(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-full text-sm h-9">
                <SelectValue placeholder="All Academic Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Academic Years</SelectItem>
                {academicYears?.map((year: any) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                    {year.isCurrent && " (Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Level Filter */}
          <div className="w-full sm:w-56">
            <Select
              value={gradeLevelFilter}
              onValueChange={(val) =>
                setGradeLevelFilter(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-full text-sm h-9">
                <SelectValue placeholder="All Grade Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grade Levels</SelectItem>
                {/* {JSON.stringify(gradeLevels)} */}
                {gradeLevels?.map((item) => (
                  <SelectItem key={item.displayName || `${item.gradeLevel}-${item.section || ''}`} value={item.gradeLevel}>
                    {item.displayName || item.gradeLevel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <SanskarLoader message="Loading exams..." />
          </div>
        ) : filteredExams && filteredExams.length > 0 ? (
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
              {filteredExams.map((exam) => {
                const schoolLevel = gradeLevelToSchoolLevel.get(
                  exam.gradeLevel,
                );
                const isSecondaryOrHigher =
                  schoolLevel === "SECONDARY" || schoolLevel === "HIGHER";

                return (
                  <TableRow
                    key={exam.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (isSecondaryOrHigher) {
                        router.push(
                          `/admin/secondary/result-compilation?year=${exam.academicYearId}&grade=${exam.gradeLevel}&exam=${exam.id}&tab=term`,
                        );
                      } else {
                        router.push(`/admin/exams/${exam.id}`);
                      }
                    }}
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
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {formatToBSFullString(exam.startDate)}
                            {exam.endDate && (
                              <> — {formatToBSFullString(exam.endDate)}</>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground pl-4.5">
                            {new Date(exam.startDate).toLocaleDateString()}
                            {exam.endDate && (
                              <>
                                {" "}
                                — {new Date(exam.endDate).toLocaleDateString()}
                              </>
                            )}
                          </div>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEditDialog(exam)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
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
                                onClick={() => handleDelete(exam.id)}
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
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {academicYearFilter || gradeLevelFilter || categoryFilter
                ? "No exams match the selected filters"
                : "No exams yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {academicYearFilter || gradeLevelFilter || categoryFilter
                ? "Try selecting different filters"
                : "Create your first exam to get started"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
