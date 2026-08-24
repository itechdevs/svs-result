"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calendar, Settings, Plus, Trash2, CheckCircle2, AlertTriangle, Info, ListPlus, Edit2, Cog } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useSubjects, useGradeLevels } from "@/hooks/use-subjects";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SanskarLoader from "@/components/shared/SanskarLoader";

interface ComponentInput {
  id?: string;
  type: "THEORY" | "PRACTICAL";
  // NEB v2: credit hour per component (Theory CH ≠ Practical CH)
  creditHour: number | string;
  fullMarks: number | string;
  passMarks: number | string;
  displayOrder: number;
  practicalHeadings?: HeadingInput[];
}

interface HeadingInput {
  name: string;
  fullMarks: number | string;
  passMarks: number | string;
  displayOrder: number;
}

export default function SecondarySubjectConfigPage() {
  const queryClient = useQueryClient();

  // Filter states
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  // Queries
  const { data: years, isLoading: isLoadingYears } = useAcademicYears();
  const { data: allGradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const { data: categories } = useGradeLevelCategories();
  const { data: syncedSubjects, isLoading: isLoadingSubjects } = useSubjects({
    gradeLevel: selectedGrade || undefined,
  });

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

  const { data: configs, isLoading: isLoadingConfigs, refetch: refetchConfigs } = useQuery<any[]>({
    queryKey: ["secondary-subject-configs", selectedYear, selectedGrade],
    queryFn: () => apiClient.get(`/admin/secondary/subject-configs?academicYearId=${selectedYear}&gradeLevel=${selectedGrade}`),
    enabled: !!selectedYear && !!selectedGrade,
  });

  const currentYear = years?.find((y) => y.isCurrent);

  // Auto-set current year
  if (!selectedYear && currentYear) {
    setSelectedYear(currentYear.id);
  }

  // Configure Dialog states
  const [configOpen, setConfigOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [components, setComponents] = useState<ComponentInput[]>([]);


  // Mutations
  const saveConfigMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/admin/secondary/subject-configs", data),
    onSuccess: (res) => {
      toast.success("Subject configuration saved successfully");
      refetchConfigs();
      setConfigOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save configuration");
    },
  });



  const openConfigure = (subject: any) => {
    setActiveSubject(subject);
    const existingConfig = configs?.find((c) => c.syncedSubjectId === subject.id);

    if (existingConfig) {
      setComponents(
        existingConfig.components.map((comp: any) => ({
          id: comp.id,
          type: comp.type,
          creditHour: comp.creditHour ?? 1,
          fullMarks: String(comp.fullMarks),
          passMarks: String(comp.passMarks),
          displayOrder: comp.displayOrder,
          practicalHeadings: comp.practicalHeadings?.map((h: any) => ({
            id: h.id,
            name: h.name,
            fullMarks: String(h.fullMarks),
            passMarks: String(h.passMarks || 0),
            displayOrder: h.displayOrder,
          })) || [],
        }))
      );
    } else {
      // NEB v2 default: Theory 75 (CH=3) + Practical 25 (CH=2)
      setComponents([
        { type: "THEORY", creditHour: 3, fullMarks: "75", passMarks: "26.25", displayOrder: 1 },
        { type: "PRACTICAL", creditHour: 2, fullMarks: "25", passMarks: "8.75", displayOrder: 2, practicalHeadings: [] },
      ]);
    }
    setConfigOpen(true);
  };



  const handleAddComponent = () => {
    const nextOrder = components.length + 1;
    setComponents([
      ...components,
      { type: "THEORY", creditHour: 1, fullMarks: "50", passMarks: "17.5", displayOrder: nextOrder },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof ComponentInput, value: any) => {
    const updated = [...components];

    if (field === "fullMarks" || field === "passMarks") {
      if (value === "" || value === "-") {
        updated[index] = { ...updated[index], [field]: "" };
      } else {
        const numValue = Number(value);
        updated[index] = { ...updated[index], [field]: isNaN(numValue) ? "" : Math.max(0, numValue).toString() };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // If switching to PRACTICAL, initialize practicalHeadings if it doesn't exist
      if (field === "type" && value === "PRACTICAL" && !updated[index].practicalHeadings) {
        updated[index].practicalHeadings = [];
      }
    }

    setComponents(updated);
  };

  const toNum = (val: any): number => {
    const n = Number(val);
    return isNaN(n) ? 0 : Math.max(0, n);
  };

  const handleSaveConfig = () => {
    if (!activeSubject || !selectedYear || !selectedGrade) return;
    if (components.length === 0) {
      toast.error("Please add at least one subject component");
      return;
    }
    // Validate: each component must have creditHour > 0
    for (const comp of components) {
      if (!toNum(comp.creditHour) || toNum(comp.creditHour) <= 0) {
        toast.error(`Each component must have a positive Credit Hour`);
        return;
      }
    }

    saveConfigMutation.mutate({
      syncedSubjectId: activeSubject.id,
      academicYearId: selectedYear,
      gradeLevel: selectedGrade,
      // NEB v2: no top-level creditHours — each component carries its own CH
      components: components.map((comp) => ({
        ...comp,
        creditHour: toNum(comp.creditHour),
        fullMarks: toNum(comp.fullMarks),
        passMarks: toNum(comp.passMarks),
        practicalHeadings: comp.practicalHeadings?.map((h) => ({
          ...h,
          fullMarks: toNum(h.fullMarks),
          passMarks: toNum(h.passMarks),
        })),
      })),
    });
  };


  const handleLoadDefaults = () => {
    // NEB v2 standard 75/25 split with typical credit hours
    setComponents([
      { type: "THEORY", creditHour: 3, fullMarks: "75", passMarks: "26.25", displayOrder: 1 },
      { type: "PRACTICAL", creditHour: 2, fullMarks: "25", passMarks: "8.75", displayOrder: 2, practicalHeadings: [] },
    ]);
  };

  const isLoading = isLoadingYears || (selectedGrade && isLoadingSubjects) || isLoadingConfigs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Secondary Subject Configurations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Configure subjects component weighting (Theory/Practical/Internal) rules for secondary grades (NEB / CDC standard).
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-card/45 backdrop-blur-md border border-border/80 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
            Academic Year
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {years?.map((year) => (
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
          <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={isLoadingGrades || secondaryGrades.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {secondaryGrades.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subject Tables */}
      {!selectedGrade || !selectedYear ? (
        <div className="bg-card border border-dashed rounded-xl p-12 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
          <p className="text-base font-semibold">Please select Academic Year and Grade Level</p>
          <p className="text-xs mt-1">
            {secondaryGrades.length > 0
              ? `Select from available secondary grades: ${secondaryGrades.join(", ")}`
              : "Loading available secondary grades..."}
          </p>
        </div>
      ) : isLoading ? (
        <SanskarLoader message="Fetching configurations..." />
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[12%]">Code</TableHead>
                <TableHead className="w-[25%]">Subject Name</TableHead>
                <TableHead className="w-[10%] text-center">Credit Hours</TableHead>
                <TableHead className="w-[38%]">Component Marks</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncedSubjects && syncedSubjects.length > 0 ? (
                syncedSubjects.map((sub) => {
                  const config = configs?.find((c) => c.syncedSubjectId === sub.id && c.isActive);

                  return (
                    <TableRow
                      key={sub.id}
                      className="hover:bg-muted/20 cursor-pointer"
                      onClick={() => openConfigure(sub)}
                    >
                      <TableCell className="font-mono text-xs">{sub.code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{sub.name}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{sub.gradeLevel}</div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {config ? (
                          <div className="flex flex-col gap-0.5 items-center">
                            {config.components.map((comp: any) => (
                              <span key={comp.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                                <span className="text-muted-foreground">{comp.type[0]}</span>
                                {comp.creditHour ?? 1} CH
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config && config.components && config.components.length > 0 ? (
                          <div className="flex flex-wrap gap-2 py-1">
                            {config.components.map((comp: any) => {
                              return (
                                <div
                                  key={comp.id}
                                  className="group border border-border/80 bg-background/50 rounded-lg p-1.5 flex items-center gap-2 text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-[10px] text-primary">{comp.type}</span>
                                    <span className="text-muted-foreground"> ({comp.fullMarks} FM)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-amber-500 text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            Not Configured
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={config ? "outline" : "default"}
                          size="sm"
                          className="text-xs font-semibold h-8"
                          onClick={() => openConfigure(sub)}
                        >
                          {config ? (
                            <>
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Configure
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Set Specs
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No subjects synchronized for {selectedGrade}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Main Configuration Dialog */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Subject: {activeSubject?.name}</DialogTitle>
            <DialogDescription>
              Grades 6-10 follow the CDC guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted-foreground">Components List</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={handleLoadDefaults}>
                  Default CDC Split (75/25)
                </Button>
                <Button variant="default" size="sm" className="text-xs bg-primary" onClick={handleAddComponent}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Component
                </Button>
              </div>
            </div>

            {components.map((comp, idx) => (
              <div key={idx} className="flex flex-col gap-3 p-4 bg-muted/20 border border-border/80 rounded-xl relative group">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/4">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">TYPE</label>
                    <Select
                      value={comp.type}
                      onValueChange={(val: any) => handleComponentChange(idx, "type", val)}
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THEORY">THEORY</SelectItem>
                        <SelectItem value="PRACTICAL">PRACTICAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* NEB v2: per-component credit hour */}
                  <div className="w-full sm:w-[80px]">
                    <label className="text-[10px] font-bold text-primary block mb-1">CREDIT HR</label>
                    <Input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={comp.creditHour ?? 1}
                      className="h-9 bg-background font-bold text-primary"
                      onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) => handleComponentChange(idx, "creditHour", e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-1/5">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">FULL MARKS</label>
                    <Input
                      type="number"
                      value={comp.fullMarks}
                      className="h-9 bg-background"
                      onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) => handleComponentChange(idx, "fullMarks", e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-1/4">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">PASS MARKS</label>
                    <Input
                      type="number"
                      step="1"
                      className="h-9 bg-background"
                      value={comp.passMarks}
                      onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      onChange={(e) => handleComponentChange(idx, "passMarks", e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-auto flex items-end justify-end flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveComponent(idx)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* NEB v2 summary: total CH is derived from components */}
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 space-y-2 mt-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" />
                  Total Full Marks:
                </span>
                <span className="font-bold text-foreground">
                  {components.reduce((sum, comp) => sum + (Number(comp.fullMarks) || 0), 0)} Marks
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/80 pt-2 mt-2">
                <span className="font-semibold text-foreground">Total Credit Hours (all components):</span>
                <span className="font-extrabold text-primary text-base">
                  {components.reduce((sum, comp) => sum + (Number(comp.creditHour) || 0), 0)} CH
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {components.map((comp, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span>{comp.type}</span>
                    <span className="font-semibold text-foreground">{Number(comp.creditHour) || 0} CH </span>
                  </div>
                ))}
              </div>
              {/* <p className="text-[10px] text-muted-foreground pt-1">
                NEB : Subject GPA = Σ(component GP × component CH) ÷ Σ(component CH)
              </p> */}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border/80 pt-4 mt-2">
            <Button variant="outline" className="text-xs" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold"
              onClick={handleSaveConfig}
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? "Saving Schema..." : "Save Subject Config"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </motion.div>
  );
}
