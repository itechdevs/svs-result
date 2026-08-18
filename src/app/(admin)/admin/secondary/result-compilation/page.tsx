"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Calendar, BookOpen, Layers, Award, Printer, CheckCircle, AlertTriangle, Eye, Loader2, ArrowRight, FileDown } from "lucide-react";
import { toast } from "sonner";
import { formatNum } from "@/lib/format-num";
import { apiClient } from "@/lib/api-client";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useExams } from "@/hooks/use-exams";
import { useGradeLevels } from "@/hooks/use-subjects";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import { Button } from "@/components/ui/button";
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
import SanskarLoader from "@/components/shared/SanskarLoader";
import { SecondaryMarksheetModal } from "@/components/secondary/SecondaryMarksheetModal";
import { SecondaryGradeSheetModal } from "@/components/secondary/SecondaryGradeSheetModal";

function SecondaryResultCompilationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = (searchParams.get("tab") as "term" | "annual") || "term";
  const selectedYear = searchParams.get("year") || "";
  const selectedGrade = searchParams.get("grade") || "";
  const selectedExamId = searchParams.get("exam") || "";

  const setQueryParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const [marksheetModalOpen, setMarksheetModalOpen] = useState(false);
  const [selectedMarksheetId, setSelectedMarksheetId] = useState<string | null>(null);
  const [viewGradeSheetResult, setViewGradeSheetResult] = useState<any>(null);
  const [viewGradeSheetType, setViewGradeSheetType] = useState<"term" | "annual">("term");

  const { data: years, isLoading: isLoadingYears } = useAcademicYears();
  const { data: allGradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const { data: categories } = useGradeLevelCategories();
  const currentYear = years?.find((y) => y.isCurrent);

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

  // Set default current year into query params
  useEffect(() => {
    if (!selectedYear && currentYear) {
      setQueryParam("year", currentYear.id);
    }
  }, [currentYear, selectedYear, setQueryParam]);

  // Clear exam param when tab changes to annual
  useEffect(() => {
    if (activeTab === "annual" && selectedExamId) {
      setQueryParam("exam", "");
    }
  }, [activeTab, selectedExamId, setQueryParam]);

  // Fetch Exams (for Term tab)
  const { data: exams, isLoading: isLoadingExams } = useExams({
    academicYearId: selectedYear || undefined,
    gradeLevel: selectedGrade || undefined,
  });

  // Query Term Results
  const { data: termResults, isLoading: isLoadingTermResults, refetch: refetchTermResults } = useQuery<any[]>({
    queryKey: ["secondary-term-results", selectedExamId],
    queryFn: () => apiClient.get(`/admin/secondary/term-results?examId=${selectedExamId}`),
    enabled: activeTab === "term" && !!selectedExamId,
  });

  // Query Annual Results
  const { data: annualResults, isLoading: isLoadingAnnualResults, refetch: refetchAnnualResults } = useQuery<any[]>({
    queryKey: ["secondary-annual-results", selectedYear, selectedGrade],
    queryFn: () => apiClient.get(`/admin/secondary/annual-results?academicYearId=${selectedYear}&gradeLevel=${selectedGrade}`),
    enabled: activeTab === "annual" && !!selectedYear && !!selectedGrade,
  });

  // Mutations
  const compileTermMutation = useMutation({
    mutationFn: (examId: string) => apiClient.post(`/admin/secondary/exams/${examId}/compile`, {}),
    onSuccess: (res: any) => {
      toast.success(`Successfully compiled term results for ${res.studentsProcessed} student(s)`);
      refetchTermResults();
    },
    onError: (err: any) => {
      toast.error(err.message || "Compilation failed. Ensure all teacher marks are entered and verified.");
    },
  });

  const publishTermMutation = useMutation({
    mutationFn: (examId: string) => apiClient.post(`/admin/secondary/exams/${examId}/publish`, {}),
    onSuccess: () => {
      toast.success("Term results published successfully!");
      refetchTermResults();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish term results");
    },
  });

  const compileAnnualMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/admin/secondary/annual/compile", body),
    onSuccess: (res: any) => {
      toast.success(`Successfully compiled annual results for ${res.studentsProcessed} student(s)`);
      refetchAnnualResults();
    },
    onError: (err: any) => {
      toast.error(err.message || "Annual compilation failed. Ensure all term weights and subject configs are set.");
    },
  });

  const publishAnnualMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/admin/secondary/annual/publish", body),
    onSuccess: () => {
      toast.success("Annual results published successfully!");
      refetchAnnualResults();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish annual results");
    },
  });

  const generateMarksheetMutation = useMutation({
    mutationFn: (body: any) => apiClient.post("/admin/secondary/marksheets", body),
    onSuccess: () => {
      toast.success("Marksheet metadata generated successfully!");
      if (activeTab === "term") refetchTermResults();
      else refetchAnnualResults();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to snapshot marksheet");
    },
  });

  const handleCompileTerm = () => {
    if (!selectedExamId) return;
    compileTermMutation.mutate(selectedExamId);
  };

  const handlePublishTerm = () => {
    if (!selectedExamId) return;
    publishTermMutation.mutate(selectedExamId);
  };

  const handleCompileAnnual = () => {
    if (!selectedYear || !selectedGrade) return;
    compileAnnualMutation.mutate({
      academicYearId: selectedYear,
      gradeLevel: selectedGrade,
    });
  };

  const handlePublishAnnual = () => {
    if (!selectedYear) return;
    publishAnnualMutation.mutate({
      academicYearId: selectedYear,
    });
  };

  const handleGenerateMarksheet = (studentId: string, resultId: string) => {
    const body = activeTab === "term" 
      ? { termResultId: resultId }
      : { annualResultId: resultId };

    generateMarksheetMutation.mutate(body);
  };

  // Flatten results into sub-rows (one per subject per student)
  const termFlatRows = useMemo(() => {
    if (!termResults) return [];
    const rows: Array<{
      result: any;
      subject: any;
      isFirstSubject: boolean;
      rowSpan: number;
      isSummaryRow: boolean;
    }> = [];
    for (const res of termResults) {
      const subjects = res.subjectResults || [];
      if (subjects.length > 0) {
        subjects.forEach((subject: any, idx: number) => {
          rows.push({
            result: res,
            subject,
            isFirstSubject: idx === 0,
            rowSpan: idx === 0 ? subjects.length : 0,
            isSummaryRow: false,
          });
        });
      } else {
        // No subject results — show a single summary row per student
        rows.push({
          result: res,
          subject: null,
          isFirstSubject: true,
          rowSpan: 1,
          isSummaryRow: true,
        });
      }
    }
    return rows;
  }, [termResults]);

  const annualFlatRows = useMemo(() => {
    if (!annualResults) return [];
    const rows: Array<{
      result: any;
      subject: any;
      isFirstSubject: boolean;
      rowSpan: number;
      isSummaryRow: boolean;
    }> = [];
    for (const res of annualResults) {
      const subjects = res.subjectResults || [];
      if (subjects.length > 0) {
        subjects.forEach((subject: any, idx: number) => {
          rows.push({
            result: res,
            subject,
            isFirstSubject: idx === 0,
            rowSpan: idx === 0 ? subjects.length : 0,
            isSummaryRow: false,
          });
        });
      } else {
        rows.push({
          result: res,
          subject: null,
          isFirstSubject: true,
          rowSpan: 1,
          isSummaryRow: true,
        });
      }
    }
    return rows;
  }, [annualResults]);

  // NEB grade lookup from percentage
  const getGradeFromPct = (obtained: number, full: number) => {
    if (full <= 0) return { grade: '—', gp: '—' };
    const pct = (obtained / full) * 100;
    if (pct >= 90) return { grade: 'A+', gp: '4.00' };
    if (pct >= 80) return { grade: 'A',  gp: '3.60' };
    if (pct >= 70) return { grade: 'B+', gp: '3.20' };
    if (pct >= 60) return { grade: 'B',  gp: '2.80' };
    if (pct >= 50) return { grade: 'C+', gp: '2.40' };
    if (pct >= 40) return { grade: 'C',  gp: '2.00' };
    if (pct >= 35) return { grade: 'D',  gp: '1.60' };
    return { grade: 'NG', gp: '0.00' };
  };

  const renderSubjectRow = (subject: any) => {
    const isNG = subject?.isNG ?? true;
    const grade = isNG ? 'NG' : (subject?.grade || 'NG');
    const gp = isNG ? '0.00' : Number(subject?.gradePoint || 0).toFixed(2);
    const components = subject?.subjectConfig?.components || [];
    const ch = components.reduce((sum: number, c: any) => sum + Number(c.creditHour || 0), 0);
    const thObtained = subject?.theoryMarks != null ? Number(subject.theoryMarks) : null;
    const prObtained = subject?.practicalMarks != null ? Number(subject.practicalMarks) : null;
    const totalObtained = subject?.totalObtained != null ? Number(subject.totalObtained) : null;
    const totalFull = subject?.totalFullMarks != null ? Number(subject.totalFullMarks) : null;
    const thComp = components.find((c: any) => c.type === 'THEORY');
    const prComp = components.find((c: any) => c.type === 'PRACTICAL');
    const thFull = thComp ? Number(thComp.fullMarks) : null;
    const prFull = prComp ? Number(prComp.fullMarks) : null;
    const thCH = thComp ? Number(thComp.creditHour) : null;
    const prCH = prComp ? Number(prComp.creditHour) : null;
    // Per-component grade/GP
    const thGrade = (thObtained !== null && thFull) ? getGradeFromPct(thObtained, thFull) : null;
    const prGrade = (prObtained !== null && prFull) ? getGradeFromPct(prObtained, prFull) : null;
    return { grade, gp, ch, isNG, thObtained, prObtained, totalObtained, totalFull, thFull, prFull, thCH, prCH, thGrade, prGrade };
  };

  const isTabLoading = isLoadingYears || isLoadingExams || 
    (activeTab === "term" ? isLoadingTermResults : isLoadingAnnualResults);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          Secondary Compile Engine (Grades 6–10)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Perform credit-hour-weighted term aggregations and annual term-weighted final compile workflows.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "term" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setQueryParam("tab", "term")}
        >
          Term Result Compilation
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "annual" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setQueryParam("tab", "annual")}
        >
          Annual Result Compilation
        </button>
      </div>

      {/* Shared Filter controls */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
            Academic Year
          </label>
          <Select value={selectedYear} onValueChange={(val) => setQueryParam("year", val)}>
            <SelectTrigger className="w-full">
              <SelectValue />
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
          <Select value={selectedGrade} onValueChange={(val) => setQueryParam("grade", val)} disabled={isLoadingGrades || secondaryGrades.length === 0}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Grade" />
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
        
        {activeTab === "term" && (
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              Select Term Exam
            </label>
            <Select value={selectedExamId} onValueChange={(val) => setQueryParam("exam", val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                {exams && exams.length > 0 ? (
                  exams.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No exam plans found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Main engine execution workflow cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTab === "term" ? (
          <>
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Layers className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Aggregate Term Marks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Processes all entered and verified subject marks (IN, TH, PR). Calculates GPA and determines NG grades.
                </p>
              </div>
              <Button
                disabled={!selectedExamId || compileTermMutation.isPending}
                onClick={handleCompileTerm}
                className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold"
              >
                {compileTermMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Compile Term Results
              </Button>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Publish Results</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transitions term sheets out of review. Published results allow marksheets generation and student view.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={!selectedExamId || termResults?.length === 0 || publishTermMutation.isPending}
                onClick={handlePublishTerm}
                className="mt-4 w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                {publishTermMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Publish Results
              </Button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-xs uppercase text-primary tracking-wider mb-2">Term Stats Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Enrolled students:</span>
                    <span className="font-bold text-foreground">{termResults?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published state:</span>
                    <span className="font-bold text-foreground">
                      {termResults && termResults.length > 0 && termResults[0].isPublished ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average GPA:</span>
                    <span className="font-bold text-foreground">
                      {termResults && termResults.length > 0
                        ? (termResults.reduce((acc, r) => acc + Number(r.gpa), 0) / termResults.length).toFixed(2)
                        : "0.00"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Award className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Extract Annual Weightages</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Processes term-by-term records against the configured weights for the year. Outputs final annual GPAs.
                </p>
              </div>
              <Button
                disabled={!selectedYear || !selectedGrade || compileAnnualMutation.isPending}
                onClick={handleCompileAnnual}
                className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold"
              >
                {compileAnnualMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin animate-pulse" />}
                Compile Annual Weighted Results
              </Button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <h3 className="font-bold text-sm text-foreground">Publish Annual Results</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Locks the final annual grades in. Allows printing final student transcripts with CDC letter templates.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={!selectedYear || !selectedGrade || annualResults?.length === 0 || publishAnnualMutation.isPending}
                onClick={handlePublishAnnual}
                className="mt-4 w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                {publishAnnualMutation.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                Publish Annual Transcripts
              </Button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-bold text-xs uppercase text-primary tracking-wider mb-2">Annual Stats Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total records compiled:</span>
                    <span className="font-bold text-foreground">{annualResults?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published state:</span>
                    <span className="font-bold text-foreground">
                      {annualResults && annualResults.length > 0 && annualResults[0].isPublished ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passing GPA:</span>
                    <span className="font-bold text-foreground">
                      {annualResults && annualResults.length > 0
                        ? (annualResults.reduce((acc, r) => acc + Number(r.gpa), 0) / annualResults.length).toFixed(2)
                        : "0.00"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Compilation Records Data-table */}
      {isTabLoading ? (
        <SanskarLoader message="Syncing compilation records..." />
      ) : activeTab === "term" ? (
        // Term results table
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/80 bg-muted/20">
            <h3 className="font-bold text-xs uppercase text-muted-foreground">Student compilation records ({termResults?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]" rowSpan={2}>Roll</TableHead>
                  <TableHead className="w-[14%]" rowSpan={2}>Student Name</TableHead>
                  <TableHead className="w-[14%]" rowSpan={2}>Subject</TableHead>
                  <TableHead className="text-center bg-blue-50/60 dark:bg-blue-950/20 border-b-0" colSpan={4}>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Theory</span>
                  </TableHead>
                  <TableHead className="text-center bg-purple-50/60 dark:bg-purple-950/20 border-b-0" colSpan={4}>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Practical</span>
                  </TableHead>
                  <TableHead className="w-[7%] text-center" rowSpan={2}>Total</TableHead>
                  <TableHead className="w-[7%] text-center" rowSpan={2}>Grade</TableHead>
                  <TableHead className="w-[5%] text-center" rowSpan={2}>GP</TableHead>
                  <TableHead className="w-[5%] text-center" rowSpan={2}>C.H.</TableHead>
                  <TableHead className="w-[8%] text-center" rowSpan={2}>Result</TableHead>
                  <TableHead className="w-[9%] text-right" rowSpan={2}>Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">Marks</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">Grade</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">GP</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">C.H.</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">Marks</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">Grade</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">GP</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">C.H.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termFlatRows.length > 0 ? (
                  termFlatRows.map(({ result, subject, isFirstSubject, rowSpan, isSummaryRow }, rowIdx) => {
                    const { grade, gp, ch, isNG, thObtained, prObtained, totalObtained, totalFull, thFull, prFull, thCH, prCH, thGrade, prGrade } = renderSubjectRow(subject);
                    const subjectName = subject?.subjectConfig?.syncedSubject?.name || 'Unknown';
                    const rowKey = subject?.id ? `sr-${subject.id}` : `term-${result.id}-${rowIdx}`;
                    return (
                      <TableRow key={rowKey} className="hover:bg-muted/10">
                        {isFirstSubject && (
                          <>
                            <TableCell rowSpan={rowSpan} className="font-mono text-xs align-top">
                              {result.syncedStudent?.rollNumber}
                            </TableCell>
                            <TableCell rowSpan={rowSpan} className="font-medium text-foreground align-top">
                              {result.syncedStudent?.name}
                              <span className="text-[10px] text-muted-foreground block font-normal">
                                Section: {result.syncedStudent?.section}
                              </span>
                            </TableCell>
                          </>
                        )}
                        {isSummaryRow ? (
                          <>
                            <TableCell className="text-xs font-semibold" colSpan={5}>
                              <span className="text-muted-foreground">Overall — </span>
                              <span className="text-primary font-bold">GPA: {formatNum(Number(result.gpa), 2)}</span>
                              <span className="text-muted-foreground mx-1">|</span>
                              <span className={result.ngSubjects > 0 ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                                {result.ngSubjects > 0 ? `${result.ngSubjects} NG` : 'No NG'}
                              </span>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-xs font-medium">{subjectName}</TableCell>
                            {/* Theory: Marks / Grade / GP / C.H. */}
                            <TableCell className="text-center text-xs font-mono bg-blue-50/30 dark:bg-blue-950/10">
                              {thObtained !== null && thFull != null
                                ? <span className={thGrade?.grade === 'NG' ? 'text-red-600 font-bold' : ''}>{thObtained}/{thFull}</span>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs font-bold bg-blue-50/30 dark:bg-blue-950/10">
                              {thGrade ? <span className={thGrade.grade === 'NG' ? 'text-red-600' : 'text-blue-700 dark:text-blue-300'}>{thGrade.grade}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                              {thGrade ? thGrade.gp : '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                              {thCH ?? '—'}
                            </TableCell>
                            {/* Practical: Marks / Grade / GP / C.H. */}
                            <TableCell className="text-center text-xs font-mono bg-purple-50/30 dark:bg-purple-950/10">
                              {prObtained !== null && prFull != null
                                ? <span className={prGrade?.grade === 'NG' ? 'text-red-600 font-bold' : ''}>{prObtained}/{prFull}</span>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs font-bold bg-purple-50/30 dark:bg-purple-950/10">
                              {prGrade ? <span className={prGrade.grade === 'NG' ? 'text-red-600' : 'text-purple-700 dark:text-purple-300'}>{prGrade.grade}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-purple-50/30 dark:bg-purple-950/10">
                              {prGrade ? prGrade.gp : '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-purple-50/30 dark:bg-purple-950/10">
                              {prCH ?? '—'}
                            </TableCell>
                            {/* Total */}
                            <TableCell className="text-center text-xs font-mono font-bold">
                              {totalObtained !== null ? `${totalObtained}${totalFull != null ? `/${totalFull}` : ''}` : '—'}
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">
                              <span className={isNG ? 'text-red-600' : 'text-emerald-600'}>{grade}</span>
                            </TableCell>
                            <TableCell className="text-center text-xs">{gp}</TableCell>
                            <TableCell className="text-center text-xs">{ch}</TableCell>
                          </>
                        )}
                        {isFirstSubject && (
                          <TableCell rowSpan={rowSpan} className="text-center align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${result.resultStatus === "PROMOTED" ? "bg-emerald-105/10 text-emerald-600 dark:text-emerald-400" : "bg-red-105/10 text-red-600 dark:text-red-405"}`}>
                              {result.resultStatus}
                            </span>
                          </TableCell>
                        )}
                        {isFirstSubject && (
                          <TableCell rowSpan={rowSpan} className="text-right align-middle">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs font-semibold text-primary"
                                onClick={() => {
                                  setViewGradeSheetResult(result);
                                  setViewGradeSheetType("term");
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                              {result.marksheet ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs font-semibold text-emerald-600 border-emerald-200"
                                  onClick={() => {
                                    setSelectedMarksheetId(result.marksheet.id);
                                    setMarksheetModalOpen(true);
                                  }}
                                >
                                  <FileDown className="w-3.5 h-3.5 mr-1" />
                                  Download
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs font-semibold text-primary"
                                  onClick={() => handleGenerateMarksheet(result.syncedStudentId, result.id)}
                                  disabled={!result.isPublished || generateMarksheetMutation.isPending}
                                >
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Generate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      {!selectedExamId ? "Select an exam plan to display compiled results." : "No compiled results for this exam plan. Click Compile Above."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        // Annual results table
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/80 bg-muted/20">
            <h3 className="font-bold text-xs uppercase text-muted-foreground">Student Annual compilation records ({annualResults?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]" rowSpan={2}>Roll</TableHead>
                  <TableHead className="w-[14%]" rowSpan={2}>Student Name</TableHead>
                  <TableHead className="w-[14%]" rowSpan={2}>Subject</TableHead>
                  <TableHead className="text-center bg-blue-50/60 dark:bg-blue-950/20 border-b-0" colSpan={3}>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Theory</span>
                  </TableHead>
                  <TableHead className="text-center bg-purple-50/60 dark:bg-purple-950/20 border-b-0" colSpan={3}>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Practical</span>
                  </TableHead>
                  <TableHead className="w-[7%] text-center" rowSpan={2}>Total</TableHead>
                  <TableHead className="w-[7%] text-center" rowSpan={2}>Grade</TableHead>
                  <TableHead className="w-[5%] text-center" rowSpan={2}>GP</TableHead>
                  <TableHead className="w-[5%] text-center" rowSpan={2}>C.H.</TableHead>
                  <TableHead className="w-[8%] text-center" rowSpan={2}>Result</TableHead>
                  <TableHead className="w-[9%] text-right" rowSpan={2}>Actions</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">Marks</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">Grade</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">GP</TableHead>
                  <TableHead className="text-center text-[9px] bg-blue-50/40 dark:bg-blue-950/10 text-blue-500 font-semibold py-1">C.H.</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">Marks</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">Grade</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">GP</TableHead>
                  <TableHead className="text-center text-[9px] bg-purple-50/40 dark:bg-purple-950/10 text-purple-500 font-semibold py-1">C.H.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {annualFlatRows.length > 0 ? (
                  annualFlatRows.map(({ result, subject, isFirstSubject, rowSpan, isSummaryRow }, rowIdx) => {
                    const { grade, gp, ch, isNG, thObtained, prObtained, totalObtained, totalFull, thFull, prFull, thCH, prCH, thGrade, prGrade } = renderSubjectRow(subject);
                    const subjectName = subject?.subjectConfig?.syncedSubject?.name || 'Unknown';
                    const rowKey = subject?.id ? `ar-${subject.id}` : `annual-${result.id}-${rowIdx}`;
                    return (
                      <TableRow key={rowKey} className="hover:bg-muted/10">
                        {isFirstSubject && (
                          <>
                            <TableCell rowSpan={rowSpan} className="font-mono text-xs align-top">
                              {result.syncedStudent?.rollNumber}
                            </TableCell>
                            <TableCell rowSpan={rowSpan} className="font-medium text-foreground align-top">
                              {result.syncedStudent?.name}
                              <span className="text-[10px] text-muted-foreground block font-normal">
                                Section: {result.syncedStudent?.section}
                              </span>
                            </TableCell>
                          </>
                        )}
                        {isSummaryRow ? (
                          <>
                            <TableCell className="text-xs font-semibold" colSpan={5}>
                              <span className="text-muted-foreground">Overall — </span>
                              <span className="text-primary font-bold">GPA: {formatNum(Number(result.gpa), 2)}</span>
                              <span className="text-muted-foreground mx-1">|</span>
                              <span className={result.ngSubjects > 0 ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                                {result.ngSubjects > 0 ? `${result.ngSubjects} NG` : 'No NG'}
                              </span>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-xs font-medium">{subjectName}</TableCell>
                            <TableCell className="text-center text-xs font-mono bg-blue-50/30 dark:bg-blue-950/10">
                              {thObtained !== null && thFull != null
                                ? <span className={thGrade?.grade === 'NG' ? 'text-red-600 font-bold' : ''}>{thObtained}/{thFull}</span>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs font-bold bg-blue-50/30 dark:bg-blue-950/10">
                              {thGrade ? <span className={thGrade.grade === 'NG' ? 'text-red-600' : 'text-blue-700 dark:text-blue-300'}>{thGrade.grade}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                              {thGrade ? thGrade.gp : '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                              {thCH ?? '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono bg-purple-50/30 dark:bg-purple-950/10">
                              {prObtained !== null && prFull != null
                                ? <span className={prGrade?.grade === 'NG' ? 'text-red-600 font-bold' : ''}>{prObtained}/{prFull}</span>
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs font-bold bg-purple-50/30 dark:bg-purple-950/10">
                              {prGrade ? <span className={prGrade.grade === 'NG' ? 'text-red-600' : 'text-purple-700 dark:text-purple-300'}>{prGrade.grade}</span> : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-purple-50/30 dark:bg-purple-950/10">
                              {prGrade ? prGrade.gp : '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs bg-purple-50/30 dark:bg-purple-950/10">
                              {prCH ?? '—'}
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono font-bold">
                              {totalObtained !== null ? `${totalObtained}${totalFull != null ? `/${totalFull}` : ''}` : '—'}
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">
                              <span className={isNG ? 'text-red-600' : 'text-emerald-600'}>{grade}</span>
                            </TableCell>
                            <TableCell className="text-center text-xs">{gp}</TableCell>
                            <TableCell className="text-center text-xs">{ch}</TableCell>
                          </>
                        )}
                        {isFirstSubject && (
                          <TableCell rowSpan={rowSpan} className="text-center align-middle">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${result.resultStatus === "PROMOTED" ? "bg-emerald-105/10 text-emerald-600 dark:text-emerald-400" : "bg-red-105/10 text-red-600 dark:text-red-405"}`}>
                              {result.resultStatus}
                            </span>
                          </TableCell>
                        )}
                        {isFirstSubject && (
                          <TableCell rowSpan={rowSpan} className="text-right align-middle">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs font-semibold text-primary"
                                onClick={() => {
                                  setViewGradeSheetResult(result);
                                  setViewGradeSheetType("annual");
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                              {result.marksheet ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs font-semibold text-purple-600 border-purple-200"
                                  onClick={() => {
                                    setSelectedMarksheetId(result.marksheet.id);
                                    setMarksheetModalOpen(true);
                                  }}
                                >
                                  <FileDown className="w-3.5 h-3.5 mr-1" />
                                  Download
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs font-semibold text-primary"
                                  onClick={() => handleGenerateMarksheet(result.syncedStudentId, result.id)}
                                  disabled={!result.isPublished || generateMarksheetMutation.isPending}
                                >
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Generate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      {!selectedGrade ? "Select a grade level to display compiled results." : "No compiled results for this academic year & grade level. Click Compile Above."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Grade Sheet Preview Modal */}
      <SecondaryGradeSheetModal
        result={viewGradeSheetResult}
        type={viewGradeSheetType}
        open={!!viewGradeSheetResult}
        onClose={() => setViewGradeSheetResult(null)}
      />

      {/* Marksheet Modal */}
      <SecondaryMarksheetModal
        marksheetId={selectedMarksheetId}
        open={marksheetModalOpen}
        onClose={() => {
          setMarksheetModalOpen(false);
          setSelectedMarksheetId(null);
        }}
      />
    </motion.div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SanskarLoader message="Loading..." />}>
      <SecondaryResultCompilationPage />
    </Suspense>
  );
}
