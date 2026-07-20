"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  Lock,
  Download,
  X,
  CheckSquare,
  Loader2,
} from "lucide-react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";
import { EvaluationPlan } from "@/types/academic";
import { exportEvaluationsToExcel } from "@/lib/export-evaluations";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

// ─── Inline Checkbox ────────────────────────────────────────────────────────
function Checkbox({
  checked,
  onCheckedChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  "aria-label"?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked === true || checked === "indeterminate"
          ? "bg-primary border-primary"
          : "border-border bg-background hover:border-primary/60"
      )}
    >
      <CheckboxPrimitive.Indicator className="text-primary-foreground">
        {checked === "indeterminate" ? (
          <span className="block w-2.5 h-0.5 bg-current rounded" />
        ) : (
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1.5,5 4,7.5 8.5,2" />
          </svg>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

interface EvaluationsTabProps {
  evaluations: EvaluationPlan[];
  setSelectedEvaluationId: (id: string) => void;
  setCurrentTab: (
    tab:
      | "dashboard"
      | "evaluations"
      | "mark-entry"
      | "student-records"
      | "allocations"
      | "result-compilation"
      | "re-exam-portal"
      | "create-evaluation",
    extraParams?: Record<string, string>,
  ) => void;
  setNewEvalTitle: (title: string) => void;
  setNewEvalSubject: (subject: string) => void;
  newEvalSubject: string;
  selectedClass?: string;
  selectedSubject?: string;
  selectedSection?: string;
  onDelete?: (id: string) => void;
}

export default function EvaluationsTab({
  evaluations,
  setSelectedEvaluationId,
  setCurrentTab,
  setNewEvalTitle,
  setNewEvalSubject,
  newEvalSubject,
  selectedClass = "",
  selectedSubject = "",
  selectedSection = "",
  onDelete,
}: EvaluationsTabProps) {
  const qs = new URLSearchParams();
  if (selectedClass) qs.set("class", selectedClass);
  if (selectedSubject) qs.set("subject", selectedSubject);
  if (selectedSection) qs.set("section", selectedSection);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteTarget = evaluations.find((e) => e.id === deleteTargetId);
  const [filter, setFilter] = useState<
    "All" | "Published" | "Draft" | "Active"
  >("All");
  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 9;

  const sorted = useMemo(
    () =>
      [...evaluations].sort((a, b) => {
        // Primary: createdAt ISO timestamp (newest first)
        const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (createdB !== createdA) return createdB - createdA;
        // Fallback: scheduled date
        const dateA =
          a.date !== "TBD" && a.date ? new Date(a.date).getTime() : 0;
        const dateB =
          b.date !== "TBD" && b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        // Stable tiebreaker: id
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      }),
    [evaluations],
  );

  const filtered =
    filter === "All" ? sorted : sorted.filter((e) => e.status === filter);

  // Combine filtered evaluations with create button at the end so most recent shows first
  const allItems = [
    ...filtered.map((e) => ({ type: "eval" as const, data: e, id: e.id })),
    { type: "create" as const, id: "create-evaluation-btn" },
  ];

  const pageCount = Math.max(1, Math.ceil(allItems.length / ROWS_PER_PAGE));
  const paginated = allItems.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  const handleFilterChange = (f: "All" | "Published" | "Draft" | "Active") => {
    setFilter(f);
    setPage(1);
  };

  const { data: profile } = useProfile();
  const teacherName = profile?.syncedTeacher?.name ?? profile?.name ?? "Teacher";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const filteredIds = useMemo(() => filtered.map((e) => e.id), [filtered]);
  const selectedInFiltered = filteredIds.filter((id) => selectedIds.has(id));

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const selectedEvaluations = filtered.filter((e) => selectedIds.has(e.id));
      const allTemplateIds = selectedEvaluations.flatMap((ev) => ev.templateIds ?? []);
      let studentResults: import("@/hooks/use-evaluations").StudentEvaluationResult[] = [];
      if (allTemplateIds.length > 0) {
        try {
          studentResults = await apiClient.get(
            `/evaluations?evaluationTemplateIds=${allTemplateIds.join(",")}&limit=5000`
          );
        } catch {
          toast.warning("Could not load student marks — exporting plan data only.");
        }
      }
      exportEvaluationsToExcel(selectedEvaluations, teacherName, studentResults);
      toast.success(
        `Exported ${selectedEvaluations.length} plan(s) with ${studentResults.length} student mark record(s).`
      );
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      key="evaluations-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Academic Evaluations Plan
          </h2>
          {(selectedClass || selectedSubject) && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing:{" "}
              <span className="font-semibold text-foreground">
                {selectedClass}
              </span>
              {selectedSection && (
                <>
                  {" "}
                  (
                  <span className="font-semibold text-foreground">
                    {selectedSection}
                  </span>
                  )
                </>
              )}
              {selectedSubject && (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-foreground">
                    {selectedSubject}
                  </span>
                </>
              )}
            </p>
          )}
        </div>
        {selectedClass && selectedSubject && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setCurrentTab("result-compilation")}
              variant="outline"
              className="font-bold flex items-center gap-2 text-xs shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Result Compilation</span>
            </Button>
            <Button
              onClick={() => setCurrentTab("create-evaluation")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold flex items-center gap-2 text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Evaluation</span>
            </Button>
          </div>
        )}
      </div>

      {(() => {
        const published = evaluations.filter(
          (e) => e.status === "Published",
        ).length;
        const drafted = evaluations.filter((e) => e.status === "Draft").length;
        const total = evaluations.length;
        const fmt = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return (
          <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-card p-3 sm:p-5 rounded-2xl border border-border shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Published Cards
              </p>
              <span className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">
                {fmt(published)}{" "}
                <span className="hidden sm:inline">Published</span>
              </span>
            </div>
            <div className="border-l border-border pl-2 sm:pl-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Drafted
              </p>
              <span className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                {fmt(drafted)} <span className="hidden sm:inline">Drafted</span>
              </span>
            </div>
            <div className="border-l border-border pl-2 sm:pl-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Total
              </p>
              <span className="text-lg sm:text-2xl font-bold text-destructive mt-1 block">
                {fmt(total)}{" "}
                <span className="hidden sm:inline">Evaluations</span>
              </span>
            </div>
          </div>
        );
      })()}

      {/* Filter Buttons & Select All Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(["All", "Published", "Draft", "Active"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                  filter === f
                    ? f === "Published"
                      ? "bg-blue-600 text-white border-blue-600"
                      : f === "Draft"
                        ? "bg-amber-500 text-white border-amber-500"
                        : f === "Active"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground border-border hover:bg-muted",
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Select All shortcut when nothing is selected */}
          {filtered.length > 0 && selectedInFiltered.length === 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllFiltered}
              className="text-muted-foreground hover:text-foreground h-8 text-xs font-semibold"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1" />
              Select All
            </Button>
          )}
        </div>

        {/* Animated Export Toolbar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-semibold text-primary">
                  {selectedIds.size} plan{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllFiltered}
                    className="h-8 text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Deselect All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isExporting ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-1" />
                    )}
                    {isExporting ? "Fetching marks…" : "Export to Excel"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Evaluations Plan Cards Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {paginated.map((item) => {
          if (item.type === "create") {
            return (
              <Button
                key={item.id}
                variant="outline"
                onClick={() => setCurrentTab("create-evaluation")}
                className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 sm:p-8 hover:bg-muted/40 transition-colors text-center group min-h-[200px] sm:min-h-[300px] h-full whitespace-normal"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4 group-hover:scale-110 transition-transform shadow-inner border border-border shrink-0">
                  <Plus className="w-6 h-6 text-foreground" />
                </div>
                <p className="font-bold text-sm text-foreground">
                  Create New Evaluation Plan
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] whitespace-normal">
                  Catalog customized assessment rubrics for your department.
                </p>
              </Button>
            );
          }

          const evalPlan = item.data;
          return (
            <div
              key={evalPlan.id}
              className={cn(
                "bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col",
                selectedIds.has(evalPlan.id) ? "border-primary ring-1 ring-primary" : "border-border"
              )}
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={selectedIds.has(evalPlan.id)}
                        onCheckedChange={() => toggleOne(evalPlan.id)}
                        aria-label={`Select ${evalPlan.title}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                          evalPlan.status === "Published"
                            ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                            : evalPlan.status === "Draft"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                              : evalPlan.status === "Active"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {evalPlan.status}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-mono block">
                        Created:{" "}
                        {evalPlan.createdAt
                          ? new Date(evalPlan.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "2-digit", year: "numeric" },
                            )
                          : evalPlan.date}
                      </span>
                    </div>
                  </div>

                  {/* Subject badge + kebab */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-muted text-foreground rounded-full uppercase tracking-wider border border-border">
                      {evalPlan.subject}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md shrink-0"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          {/* {evalPlan.status === "Published" ? (
                            <div className="flex items-center gap-2 text-muted-foreground opacity-50 cursor-not-allowed w-full">
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </div>
                          ) : ( */}
                          <Link
                            href={`/teacher/edit-evaluation/${evalPlan.subEvaluations?.[0]?.id ?? evalPlan.id}${suffix}`}
                            className="flex items-center gap-2 cursor-pointer w-full"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          {/* )} */}
                        </DropdownMenuItem>
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                              onSelect={() => setDeleteTargetId(evalPlan.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div>
                  <h3
                    className="font-bold text-sm text-foreground leading-snug truncate"
                    title={evalPlan.title}
                  >
                    {evalPlan.title}
                  </h3>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                    Unit Title
                  </label>
                  <div
                    className="w-full bg-muted/40 border border-border rounded-lg px-2.5 py-2 text-xs text-foreground font-medium truncate"
                    title={evalPlan.unit || undefined}
                  >
                    {evalPlan.unit || (
                      <span className="text-muted-foreground italic">
                        Not set
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                      Task Types
                    </span>
                    <span className="font-bold text-xs text-foreground font-mono">
                      {evalPlan.testTypes}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase block">
                      Outcomes tracked
                    </span>
                    <span className="font-bold text-xs text-foreground font-mono">
                      {evalPlan.outcomes}
                    </span>
                  </div>
                </div>

                {/* Preview of what is inside */}
                {evalPlan.learningOutcomes &&
                  evalPlan.learningOutcomes.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">
                        Task Types Preview
                      </span>
                      <ul className="text-[10px] text-muted-foreground space-y-1">
                        {Array.from(
                          new Set(
                            evalPlan.learningOutcomes.map(
                              (lo) => lo.taskType || "Standard",
                            ),
                          ),
                        )
                          .slice(0, 3)
                          .map((tt, idx) => (
                            <li
                              key={idx}
                              className="truncate flex items-center gap-1.5"
                            >
                              <span className="w-1 h-1 rounded-full bg-foreground shrink-0" />
                              <span className="font-semibold text-foreground">
                                {tt}
                              </span>
                            </li>
                          ))}
                        {Array.from(
                          new Set(
                            evalPlan.learningOutcomes.map((lo) => lo.taskType),
                          ),
                        ).length > 3 && (
                          <li className="text-[9px] text-muted-foreground italic mt-1 pl-2.5">
                            +{" "}
                            {Array.from(
                              new Set(
                                evalPlan.learningOutcomes.map(
                                  (lo) => lo.taskType,
                                ),
                              ),
                            ).length - 3}{" "}
                            more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
              </div>

              <div className="px-5 pb-5 pt-2 border-t border-border/50">
                <Button
                  onClick={() => {
                    setSelectedEvaluationId(evalPlan.id);
                    setCurrentTab("mark-entry", {
                      class: evalPlan.gradeLevel || "",
                      subject: evalPlan.subject || "",
                      eval: evalPlan.title,
                    });
                  }}
                  className={cn(
                    "w-full font-bold text-xs",
                    evalPlan.status === "Published"
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-950/60"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {evalPlan.status === "Published"
                    ? "Preview Marks"
                    : "Enter Marks"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center mt-6">
          <Stack spacing={2}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
            />
          </Stack>
        </div>
      )}

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete?.(deleteTargetId!);
                setDeleteTargetId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
