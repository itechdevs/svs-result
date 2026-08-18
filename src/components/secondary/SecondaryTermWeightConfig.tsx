"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useExams } from "@/hooks/use-exams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SanskarLoader from "@/components/shared/SanskarLoader";

interface TermWeightInput {
  examId: string;
  termName: string;
  weightPercent: string;
}

interface SecondaryTermWeightConfigProps {
  academicYearId: string;
  gradeLevel: string;
}

export function SecondaryTermWeightConfig({
  academicYearId,
  gradeLevel,
}: SecondaryTermWeightConfigProps) {
  const queryClient = useQueryClient();

  const { data: exams, isLoading: isLoadingExams } = useExams({
    academicYearId,
    gradeLevel,
  });

  const {
    data: existingWeights,
    isLoading: isLoadingWeights,
    refetch: refetchWeights,
  } = useQuery<any[]>({
    queryKey: ["secondary-term-weights", academicYearId, gradeLevel],
    queryFn: () =>
      apiClient.get(
        `/admin/secondary/term-weights?academicYearId=${academicYearId}&gradeLevel=${gradeLevel}`
      ),
    enabled: !!academicYearId && !!gradeLevel,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.post("/admin/secondary/term-weights", data),
    onSuccess: () => {
      toast.success("Term weights saved successfully");
      refetchWeights();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save term weights");
    },
  });

  const [weights, setWeights] = useState<TermWeightInput[]>([]);

  useEffect(() => {
    if (existingWeights && existingWeights.length > 0) {
      setWeights(
        existingWeights.map((w: any) => ({
          examId: w.examId,
          termName: w.termName,
          weightPercent: String(w.weightPercent),
        }))
      );
    } else if (exams && exams.length > 0 && existingWeights && existingWeights.length === 0) {
      setWeights(
        exams.map((e) => ({
          examId: e.id,
          termName: e.name,
          weightPercent: "0",
        }))
      );
    }
  }, [existingWeights, exams]);

  const totalWeight = weights.reduce(
    (acc, w) => acc + (Number(w.weightPercent) || 0),
    0
  );

  const updateWeight = (index: number, field: keyof TermWeightInput, value: string) => {
    const newW = [...weights];
    newW[index][field] = value;
    setWeights(newW);
  };

  const handleReset = () => {
    if (existingWeights && existingWeights.length > 0) {
      setWeights(
        existingWeights.map((w: any) => ({
          examId: w.examId,
          termName: w.termName,
          weightPercent: String(w.weightPercent),
        }))
      );
    } else if (exams && exams.length > 0) {
      setWeights(
        exams.map((e) => ({
          examId: e.id,
          termName: e.name,
          weightPercent: "0",
        }))
      );
    }
    toast.info("Form reset to original state");
  };

  const handleSave = () => {
    if (weights.length === 0) {
      return toast.error("No exams available to configure.");
    }

    if (weights.some((w) => !w.examId || !w.termName || !w.weightPercent)) {
      return toast.error("Please fill in all fields for all terms.");
    }

    if (Math.abs(totalWeight - 100) > 0.01) {
      return toast.error("Total weight must equal 100%.");
    }

    // Check duplicates (shouldn't happen with auto-populate, but good to keep)
    const examIds = weights.map((w) => w.examId);
    if (new Set(examIds).size !== examIds.length) {
      return toast.error("Duplicate exams selected.");
    }

    saveMutation.mutate({
      academicYearId,
      gradeLevel,
      weights: weights.map((w, idx) => ({
        academicYearId,
        gradeLevel,
        examId: w.examId,
        termName: w.termName,
        weightPercent: Number(w.weightPercent),
        displayOrder: idx,
      })),
    });
  };

  if (isLoadingExams || isLoadingWeights) {
    return (
      <div className="py-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <div>
          <h3 className="font-bold text-sm text-foreground">Combined Examination Configuration</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Configure how exams combine to form the final result. Total weight must equal exactly 100%. Set weight to 0 for exams you want to exclude.
          </p>
        </div>
      </div>

      <div className="mb-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-4 text-xs text-blue-800 dark:text-blue-300">
        <h4 className="font-bold mb-2">What is a Combined Exam?</h4>
        <p className="mb-2">
          A combined exam aggregates marks from two or more exams (e.g., First Term + Second Term) into a single unified result. This supports continuous assessment and provides a fairer representation of overall performance.
        </p>
        <h4 className="font-bold mb-2">Core Calculation Logic</h4>
        <p>
          Combined Marks = Σ (Each Component Exam's Marks × Weight%).<br />
          Example: If a student scores 20/100 in Term 1 (40% weight) and 85/100 in Term 2 (60% weight), their combined score is (20 × 0.4) + (85 × 0.6) = 8 + 51 = 59/100.
        </p>
      </div>

      <div className="space-y-3">
        {weights.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            No exams found for this grade level and academic year.
          </div>
        ) : (
          weights.map((w, idx) => {
            const originalExam = exams?.find(e => e.id === w.examId);
            return (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="flex-1 w-full">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Exam Plan</label>
                  <div className="h-9 flex items-center px-3 border border-border rounded-md bg-muted/50 text-sm text-muted-foreground">
                    {originalExam ? originalExam.name : "Unknown Exam"}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Term Display Name</label>
                  <Input
                    value={w.termName}
                    onChange={(e) => updateWeight(idx, "termName", e.target.value)}
                    placeholder="e.g. First Term"
                    className="h-9"
                  />
                </div>

                <div className="w-full sm:w-28 shrink-0">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Weight %</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={w.weightPercent}
                      onChange={(e) => updateWeight(idx, "weightPercent", e.target.value)}
                      placeholder="0"
                      className="h-9 pr-6 text-center font-bold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm font-semibold">
          Total Weight:{" "}
          <span
            className={
              Math.abs(totalWeight - 100) > 0.01
                ? "text-destructive font-bold"
                : "text-emerald-500 font-bold"
            }
          >
            {totalWeight}%
          </span>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs h-9 flex-1 sm:flex-none"
            disabled={saveMutation.isPending || isLoadingWeights}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              saveMutation.isPending ||
              weights.length === 0 ||
              Math.abs(totalWeight - 100) > 0.01
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 flex-1 sm:flex-none"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
}
