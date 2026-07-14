"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, Save, Trash2, Sliders, CheckCircle2, AlertCircle, Plus, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useExams } from "@/hooks/use-exams";
import { useGradeLevels } from "@/hooks/use-subjects";
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
import SanskarLoader from "@/components/shared/SanskarLoader";

interface WeightItem {
  examId: string;
  termName: string;
  weightPercent: number;
  displayOrder: number;
}

export default function SecondaryTermWeightsPage() {
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  const { data: years, isLoading: isLoadingYears } = useAcademicYears();
  const { data: allGradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const currentYear = years?.find((y) => y.isCurrent);

  // Filter to only secondary and higher secondary grades
  const secondaryGrades = allGradeLevels?.filter((grade) => {
    const category = categorizeGradeLevel(grade);
    return category === "SECONDARY" || category === "HIGHER_SECONDARY";
  }) || [];

  // Set default current year
  useEffect(() => {
    if (!selectedYear && currentYear) {
      setSelectedYear(currentYear.id);
    }
  }, [currentYear, selectedYear]);

  // Fetch Exams
  const { data: exams, isLoading: isLoadingExams } = useExams({
    academicYearId: selectedYear || undefined,
    gradeLevel: selectedGrade || undefined,
  });

  // Fetch Saved Weights
  const { data: savedWeights, isLoading: isLoadingWeights, refetch: refetchWeights } = useQuery<any[]>({
    queryKey: ["secondary-term-weights", selectedYear, selectedGrade],
    queryFn: () => apiClient.get(`/admin/secondary/term-weights?academicYearId=${selectedYear}&gradeLevel=${selectedGrade}`),
    enabled: !!selectedYear && !!selectedGrade,
  });

  const [weights, setWeights] = useState<WeightItem[]>([]);

  // Update states on weights fetch
  useEffect(() => {
    if (savedWeights && savedWeights.length > 0) {
      setWeights(
        savedWeights.map((w: any) => ({
          examId: w.examId,
          termName: w.termName,
          weightPercent: Number(w.weightPercent),
          displayOrder: w.displayOrder,
        }))
      );
    } else {
      setWeights([]);
    }
  }, [savedWeights]);

  // Save Mutation
  const saveWeightsMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/admin/secondary/term-weights", data),
    onSuccess: () => {
      toast.success("Term weights configured successfully");
      refetchWeights();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save term weight configuration");
    },
  });

  const handleAddExamWeight = (examId: string) => {
    const examObj = exams?.find((e) => e.id === examId);
    if (!examObj) return;

    if (weights.some((w) => w.examId === examId)) {
      toast.warning("Exam weight config already added");
      return;
    }

    setWeights([
      ...weights,
      {
        examId,
        termName: examObj.name,
        weightPercent: 0,
        displayOrder: weights.length + 1,
      },
    ]);
  };

  const handleRemoveWeight = (index: number) => {
    setWeights(weights.filter((_, i) => i !== index));
  };

  const handleWeightChange = (index: number, val: number) => {
    const updated = [...weights];
    updated[index].weightPercent = Math.max(0, Math.min(100, val));
    setWeights(updated);
  };

  const handleTermNameChange = (index: number, val: string) => {
    const updated = [...weights];
    updated[index].termName = val;
    setWeights(updated);
  };

  const handleSave = () => {
    if (!selectedYear || !selectedGrade) return;

    const totalWeight = weights.reduce((sum, w) => sum + w.weightPercent, 0);
    if (weights.length === 0) {
      toast.error("Please add weightings for at least one term exam");
      return;
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`Weights must sum exactly to 100%. Current sum: ${totalWeight}%`);
      return;
    }

    saveWeightsMutation.mutate({
      academicYearId: selectedYear,
      gradeLevel: selectedGrade,
      weights: weights.map((w) => ({
        ...w,
        academicYearId: selectedYear,
        gradeLevel: selectedGrade,
      })),
    });
  };

  const handlePresetSplit = (preset: string) => {
    if (weights.length === 0) {
      toast.error("Please select term exams first to apply split presets");
      return;
    }

    const updated = [...weights];
    if (preset === "equal") {
      const split = Number((100 / weights.length).toFixed(2));
      updated.forEach((w) => { w.weightPercent = split; });
    } else if (preset === "standard-3") {
      if (weights.length !== 3) {
        toast.error("Presets template standard three term weighting requires exactly 3 active terms");
        return;
      }
      updated[0].weightPercent = 10;
      updated[1].weightPercent = 30;
      updated[2].weightPercent = 60;
    } else if (preset === "standard-2") {
      if (weights.length !== 2) {
        toast.error("Presets template standard two term weighting requires exactly 2 active terms");
        return;
      }
      updated[0].weightPercent = 30;
      updated[1].weightPercent = 70;
    }
    setWeights(updated);
  };

  const totalAddedPct = weights.reduce((sum, w) => sum + w.weightPercent, 0);
  const remainingPct = 100 - totalAddedPct;

  const isLoading = isLoadingYears || (selectedGrade && isLoadingExams) || isLoadingWeights;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="w-8 h-8 text-primary" />
          Secondary Term Weights Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Specify weights for each term exam. Final Annual marks are aggregated on these weightages.
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
            Academic Year
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Academic Year" />
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
              <SelectValue placeholder="Select Grade Level" />
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

      {!selectedGrade || !selectedYear ? (
        <div className="bg-card border border-dashed rounded-xl p-12 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3 animate-pulse" />
          <p className="text-base font-semibold">Select Academic Year and Grade Level</p>
          <p className="text-xs mt-1">
            {secondaryGrades.length > 0 
              ? `Select from available secondary grades: ${secondaryGrades.join(", ")}`
              : "Loading available secondary grades..."}
          </p>
        </div>
      ) : isLoading ? (
        <SanskarLoader message="Fetching weights..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Weight config panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">Term Weight Allocation</h3>
                {weights.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetSplit("equal")}>
                      Equal Split
                    </Button>
                    {weights.length === 3 && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetSplit("standard-3")}>
                        10 / 30 / 60 Template
                      </Button>
                    )}
                    {weights.length === 2 && (
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetSplit("standard-2")}>
                        30 / 70 Template
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {weights.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No term weights configured yet. Add term exams from the panel on the right.
                </div>
              ) : (
                <div className="space-y-4">
                  {weights.map((item, idx) => (
                    <div key={item.examId} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted/40 rounded-xl relative group">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Term Name / Alias
                        </label>
                        <Input
                          value={item.termName}
                          className="h-9 font-medium"
                          onChange={(e) => handleTermNameChange(idx, e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                          Weight (%)
                        </label>
                        <div className="relative flex items-center">
                          <Input
                            type="number"
                            value={item.weightPercent}
                            className="h-9 pr-6 text-center font-bold"
                            onChange={(e) => handleWeightChange(idx, Number(e.target.value) || 0)}
                          />
                          <span className="absolute right-2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <div className="sm:pt-5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveWeight(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Sum calculator */}
                    <div className="flex items-center gap-2">
                      {Math.abs(remainingPct) < 0.01 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/40">
                          <CheckCircle2 className="w-4 h-4" /> Ready to Save (100% matched)
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${remainingPct > 0 ? "bg-amber-100 dark:bg-amber-950/45 text-amber-800 dark:text-amber-300 border border-amber-250" : "bg-red-100 dark:bg-red-950/45 text-red-800 dark:text-red-300 border border-red-250"}`}>
                          <AlertCircle className="w-4 h-4" /> 
                          {remainingPct > 0 
                            ? `Requires ${remainingPct.toFixed(1)}% more`
                            : `Exceeds 100% by ${Math.abs(remainingPct).toFixed(1)}%`
                          }
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold gap-2 px-4 py-2"
                      onClick={handleSave}
                      disabled={saveWeightsMutation.isPending || Math.abs(remainingPct) > 0.01}
                    >
                      <Save className="w-4 h-4" />
                      {saveWeightsMutation.isPending ? "Saving..." : "Save Weights"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exam addition picker panel */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Exams for {selectedGrade}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Pick the exams in this Academic Year to configure for final Annual aggregation.
              </p>

              <div className="space-y-2 mt-2">
                {exams && exams.length > 0 ? (
                  exams.map((exam) => {
                    const isAdded = weights.some((w) => w.examId === exam.id);
                    return (
                      <div
                        key={exam.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${isAdded ? "bg-muted/50 border-border opacity-70" : "bg-card border-border/85 hover:border-primary/50"}`}
                      >
                        <div className="font-medium text-foreground">{exam.name}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 font-bold"
                          onClick={() => handleAddExamWeight(exam.id)}
                          disabled={isAdded}
                        >
                          {isAdded ? "Added" : <Plus className="w-4 h-4 text-primary" />}
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-[11px] text-muted-foreground">
                    No active exam plans for this grade level.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
