"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sparkles, Calendar, BookOpen, Layers, Award, Printer, CheckCircle, AlertTriangle, Eye, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useAcademicYears } from "@/hooks/use-academic-config";
import { useExams } from "@/hooks/use-exams";
import { useGradeLevels } from "@/hooks/use-subjects";
import { categorizeGradeLevel } from "@/lib/schemas";
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

export default function SecondaryResultCompilationPage() {
  const [activeTab, setActiveTab] = useState<"term" | "annual">("term");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

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
    mutationFn: (body: any) => apiClient.post("/api/admin/secondary/marksheets", body),
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
          onClick={() => setActiveTab("term")}
        >
          Term Result Compilation
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === "annual" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("annual")}
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
          <Select value={selectedYear} onValueChange={setSelectedYear}>
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
          <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={isLoadingGrades || secondaryGrades.length === 0}>
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
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Roll</TableHead>
                <TableHead className="w-[30%]">Student Name</TableHead>
                <TableHead className="w-[15%] text-center">GPA</TableHead>
                <TableHead className="w-[15%] text-center">NG Subjects</TableHead>
                <TableHead className="w-[15%] text-center">Result Status</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {termResults && termResults.length > 0 ? (
                termResults.map((res) => (
                  <TableRow key={res.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-xs">{res.syncedStudent?.rollNumber}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {res.syncedStudent?.name}
                      <span className="text-[10px] text-muted-foreground block font-normal">
                        Section: {res.syncedStudent?.section}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">{Number(res.gpa).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {res.ngSubjects > 0 ? (
                        <span className="text-red-500 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {res.ngSubjects} NG
                        </span>
                      ) : (
                        <span className="text-emerald-500">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${res.resultStatus === "PROMOTED" ? "bg-emerald-105/10 text-emerald-600 dark:text-emerald-400" : "bg-red-105/10 text-red-600 dark:text-red-405"}`}>
                        {res.resultStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-semibold text-primary"
                          onClick={() => handleGenerateMarksheet(res.syncedStudentId, res.id)}
                          disabled={!res.isPublished || generateMarksheetMutation.isPending}
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          {res.marksheet ? "Regen Sheet" : "Snapshot"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {!selectedExamId ? "Select an exam plan to display compiled results." : "No compiled results for this exam plan. Click Compile Above."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // Annual results table
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/80 bg-muted/20">
            <h3 className="font-bold text-xs uppercase text-muted-foreground">Student Annual compilation records ({annualResults?.length || 0})</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[10%]">Roll</TableHead>
                <TableHead className="w-[30%]">Student Name</TableHead>
                <TableHead className="w-[15%] text-center">GPA</TableHead>
                <TableHead className="w-[15%] text-center">NG Subjects</TableHead>
                <TableHead className="w-[15%] text-center">Result Status</TableHead>
                <TableHead className="w-[15%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {annualResults && annualResults.length > 0 ? (
                annualResults.map((res) => (
                  <TableRow key={res.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-xs">{res.syncedStudent?.rollNumber}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {res.syncedStudent?.name}
                      <span className="text-[10px] text-muted-foreground block font-normal">
                        Section: {res.syncedStudent?.section}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-primary">{Number(res.gpa).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {res.ngSubjects > 0 ? (
                        <span className="text-red-500 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {res.ngSubjects} NG
                        </span>
                      ) : (
                        <span className="text-emerald-500">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${res.resultStatus === "PROMOTED" ? "bg-emerald-105/10 text-emerald-600 dark:text-emerald-400" : "bg-red-105/10 text-red-600 dark:text-red-405"}`}>
                        {res.resultStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-semibold text-primary"
                          onClick={() => handleGenerateMarksheet(res.syncedStudentId, res.id)}
                          disabled={!res.isPublished || generateMarksheetMutation.isPending}
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          {res.marksheet ? "Regen Transcript" : "Snapshot"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {!selectedGrade ? "Select a grade level to display compiled results." : "No compiled results for this academic year & grade level. Click Compile Above."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
