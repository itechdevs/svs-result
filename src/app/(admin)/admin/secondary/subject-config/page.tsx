"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Calendar, Settings, Plus, Trash2, CheckCircle2, AlertTriangle, Info, ListPlus, Edit2, Cog } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useSubjects, useGradeLevels } from "@/hooks/use-subjects";
import { categorizeGradeLevel } from "@/lib/schemas";
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
  type: "INTERNAL" | "THEORY" | "PRACTICAL";
  fullMarks: number;
  passMarks: number;
  displayOrder: number;
  practicalHeadings?: any[];
}

interface HeadingInput {
  name: string;
  fullMarks: number;
  passMarks: number;
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
  const { data: syncedSubjects, isLoading: isLoadingSubjects } = useSubjects({
    gradeLevel: selectedGrade || undefined,
  });

  // Filter to only secondary and higher secondary grades
  const secondaryGrades = allGradeLevels?.filter((grade) => {
    const category = categorizeGradeLevel(grade);
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
  const [creditHours, setCreditHours] = useState<number>(4);
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

    // Check if configuration already exists
    const existingConfig = configs?.find((c) => c.syncedSubjectId === subject.id);

    if (existingConfig) {
      setCreditHours(existingConfig.creditHours);
      setComponents(
        existingConfig.components.map((comp: any) => ({
          id: comp.id,
          type: comp.type,
          fullMarks: Number(comp.fullMarks),
          passMarks: Number(comp.passMarks),
          displayOrder: comp.displayOrder,
          practicalHeadings: comp.practicalHeadings?.map((h: any) => ({
            id: h.id,
            name: h.name,
            fullMarks: Number(h.fullMarks),
            passMarks: Number(h.passMarks || 0),
            displayOrder: h.displayOrder,
          })) || [],
        }))
      );
    } else {
      // Default standard CDC setup
      setCreditHours(4);
      setComponents([
        { type: "THEORY", fullMarks: 75, passMarks: 26.25, displayOrder: 1 },
        { type: "INTERNAL", fullMarks: 25, passMarks: 8.75, displayOrder: 2 },
      ]);
    }
    setConfigOpen(true);
  };



  const handleAddComponent = () => {
    const nextOrder = components.length + 1;
    setComponents([
      ...components,
      { type: "THEORY", fullMarks: 50, passMarks: 17.5, displayOrder: nextOrder },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof ComponentInput, value: any) => {
    const updated = [...components];

    if (field === "fullMarks" || field === "passMarks") {
      const numValue = Number(value) || 0;
      updated[index] = {
        ...updated[index],
        [field]: numValue,
      };
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

  const handleSaveConfig = () => {
    if (!activeSubject || !selectedYear || !selectedGrade) return;

    if (components.length === 0) {
      toast.error("Please add at least one subject component");
      return;
    }

    saveConfigMutation.mutate({
      syncedSubjectId: activeSubject.id,
      academicYearId: selectedYear,
      gradeLevel: selectedGrade,
      creditHours: Number(creditHours) || 0,
      components,
    });
  };

  const handleAddSubCategory = (compIndex: number) => {
    const updated = [...components];
    const comp = updated[compIndex];
    if (!comp.practicalHeadings) comp.practicalHeadings = [];

    const nextOrder = comp.practicalHeadings.length + 1;
    comp.practicalHeadings.push({ name: "", fullMarks: 10, passMarks: 4, displayOrder: nextOrder });
    setComponents(updated);
  };

  const handleRemoveSubCategory = (compIndex: number, subIndex: number) => {
    const updated = [...components];
    if (updated[compIndex].practicalHeadings) {
      updated[compIndex].practicalHeadings = updated[compIndex].practicalHeadings.filter((_, i) => i !== subIndex);
    }
    setComponents(updated);
  };

  const handleSubCategoryChange = (compIndex: number, subIndex: number, field: keyof HeadingInput, value: any) => {
    const updated = [...components];
    if (updated[compIndex].practicalHeadings) {
      updated[compIndex].practicalHeadings[subIndex] = {
        ...updated[compIndex].practicalHeadings[subIndex],
        [field]: field === "fullMarks" || field === "passMarks" ? (Number(value) || 0) : value,
      };
    }
    setComponents(updated);
  };


  const handleLoadDefaults = () => {
    setComponents([
      { type: "THEORY", fullMarks: 75, passMarks: 26.25, displayOrder: 1 },
      { type: "INTERNAL", fullMarks: 25, passMarks: 8.75, displayOrder: 2 },
    ]);
    setCreditHours(4);
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
                <TableHead className="w-[38%]">Evaluations & Component Marks</TableHead>
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
                          <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                            {config.creditHours} CH
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config && config.components && config.components.length > 0 ? (
                          <div className="flex flex-wrap gap-2 py-1">
                            {config.components.map((comp: any) => {
                              const hasHeadings = comp.type === "PRACTICAL";
                              const headingsCount = comp.practicalHeadings?.length || 0;
                              return (
                                <div
                                  key={comp.id}
                                  className="group border border-border/80 bg-background/50 rounded-lg p-1.5 flex items-center gap-2 text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-[10px] text-primary">{comp.type}</span>
                                    <span className="text-muted-foreground"> ({comp.fullMarks} FM)</span>
                                  </div>

                                  {hasHeadings && (
                                    <Button
                                      variant="ghost"
                                      className={`h-6 px-1.5 text-[10px] font-semibold hover:bg-sky-50 dark:hover:bg-sky-950/20 ${headingsCount > 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-sky-600 dark:text-sky-400"
                                        }`}
                                      onClick={() => openConfigure(sub)}
                                    >
                                      {headingsCount > 0 ? (
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                          {headingsCount} Criteria
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <ListPlus className="w-3.5 h-3.5" />
                                          Add Headings
                                        </span>
                                      )}
                                    </Button>
                                  )}
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
            <DialogTitle>Configure Subject evaluation: {activeSubject?.name}</DialogTitle>
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
                  <div className="w-full sm:w-1/3">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">TYPE</label>
                    <Select
                      value={comp.type}
                      onValueChange={(val: any) => handleComponentChange(idx, "type", val)}
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERNAL">INTERNAL</SelectItem>
                        <SelectItem value="THEORY">THEORY</SelectItem>
                        <SelectItem value="PRACTICAL">PRACTICAL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-1/4">
                    <label className="text-[10px] font-bold text-muted-foreground block mb-1">FULL MARKS</label>
                    <Input
                      type="number"
                      value={comp.fullMarks}
                      className="h-9 bg-background"
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

                {comp.type === "PRACTICAL" && (
                  <div className="mt-2 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Practical Sub Categories</h4>
                    </div>
                    <div className="space-y-2">
                      {comp.practicalHeadings?.map((heading, hIdx) => (
                        <div key={hIdx} className="flex flex-col sm:flex-row gap-3 p-3 bg-background border border-border/60 rounded-lg items-end">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">SUB CATEGORY NAME</label>
                            <Input
                              placeholder="e.g. Experiment, Viva"
                              value={heading.name}
                              onChange={(e) => handleSubCategoryChange(idx, hIdx, "name", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">FULL MARKS</label>
                            <Input
                              type="number"
                              value={heading.fullMarks}
                              onChange={(e) => handleSubCategoryChange(idx, hIdx, "fullMarks", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">PASS MARKS</label>
                            <Input
                              type="number"
                              value={heading.passMarks || 0}
                              onChange={(e) => handleSubCategoryChange(idx, hIdx, "passMarks", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveSubCategory(idx, hIdx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}

                      <div className="pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-dashed text-muted-foreground hover:text-foreground"
                          onClick={() => handleAddSubCategory(idx)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Sub Category
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Calculations summaries */}
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
                <span className="font-semibold text-foreground">Credit Hours:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={creditHours || ""}
                    onChange={(e) => setCreditHours(Number(e.target.value) || 0)}
                    className="w-20 h-8 font-bold text-center"
                  />
                  <span className="font-extrabold text-primary text-base">CH</span>
                </div>
              </div>
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
