"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User, 
  BookOpen, 
  FileCheck,
  Loader2,
  Filter
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import SanskarLoader from "@/components/shared/SanskarLoader";

interface SecondaryComponentMark {
  id: string;
  marksObtained: number | null;
  isAbsent: boolean;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED";
  submittedAt: string | null;
  verifiedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  syncedStudent: {
    id: string;
    name: string;
    rollNumber: string | null;
    section: string | null;
  };
  component: {
    id: string;
    type: string;
    fullMarks: number;
    passMarks: number;
    subjectConfig: {
      syncedSubject: {
        name: string;
      };
    };
  };
  exam: {
    id: string;
    name: string;
    gradeLevel: string;
  };
  enteredBy: {
    name: string;
    email: string;
  };
  verifiedBy: {
    name: string;
  } | null;
}

export default function SecondaryMarkVerificationPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "DRAFT" | "SUBMITTED" | "VERIFIED">("SUBMITTED");

  const { data: years, isLoading: isLoadingYears } = useAcademicYears();
  const { data: allGradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const currentYear = years?.find((y) => y.isCurrent);

  // Filter to only secondary and higher secondary grades
  const secondaryGrades = allGradeLevels?.filter((grade) => {
    const category = categorizeGradeLevel(grade);
    return category === "SECONDARY" || category === "HIGHER_SECONDARY";
  }) || [];

  // Fetch Exams
  const { data: exams, isLoading: isLoadingExams } = useExams({
    academicYearId: selectedYear || currentYear?.id,
    gradeLevel: selectedGrade || undefined,
  });

  // Fetch marks that need verification
  const { data: marks, isLoading: isLoadingMarks, refetch } = useQuery<SecondaryComponentMark[]>({
    queryKey: ["secondary-marks-verification", selectedExamId, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedExamId) params.set("examId", selectedExamId);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      return apiClient.get(`/admin/secondary/marks?${params.toString()}`);
    },
    enabled: !!selectedExamId,
  });

  // Verify single mark mutation
  const verifySingleMutation = useMutation({
    mutationFn: (markId: string) => 
      apiClient.post(`/admin/secondary/marks/${markId}/verify`, { remarks: "Verified by admin" }),
    onSuccess: () => {
      toast.success("Mark verified successfully");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["secondary-marks-verification"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify mark");
    },
  });

  // Verify all submitted marks mutation
  const verifyAllSubmittedMutation = useMutation({
    mutationFn: async () => {
      const submittedMarks = marks?.filter(m => m.status === "SUBMITTED") || [];
      const promises = submittedMarks.map(mark => 
        apiClient.post(`/admin/secondary/marks/${mark.id}/verify`, { remarks: "Bulk verified by admin" })
      );
      await Promise.all(promises);
      return submittedMarks.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully verified ${count} marks`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["secondary-marks-verification"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to bulk verify marks");
    },
  });

  const handleVerifySingle = (markId: string) => {
    verifySingleMutation.mutate(markId);
  };

  const handleVerifyAllSubmitted = () => {
    const submittedCount = marks?.filter(m => m.status === "SUBMITTED").length || 0;
    if (submittedCount === 0) {
      toast.warning("No submitted marks to verify");
      return;
    }
    verifyAllSubmittedMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" className="text-gray-600"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case "SUBMITTED":
        return <Badge variant="outline" className="text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "VERIFIED":
        return <Badge variant="outline" className="text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    total: marks?.length || 0,
    draft: marks?.filter(m => m.status === "DRAFT").length || 0,
    submitted: marks?.filter(m => m.status === "SUBMITTED").length || 0,
    verified: marks?.filter(m => m.status === "VERIFIED").length || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileCheck className="w-8 h-8 text-primary animate-pulse" />
          Mark Verification Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review and verify secondary component marks submitted by teachers before compilation.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              Academic Year
            </label>
            <Select value={selectedYear || currentYear?.id} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Year" />
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
            <Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={isLoadingGrades}>
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

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
              Exam
            </label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId} disabled={isLoadingExams || !selectedGrade}>
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
                  <SelectItem value="none" disabled>No exams found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Status Filter
            </label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft Only</SelectItem>
                <SelectItem value="SUBMITTED">Submitted Only</SelectItem>
                <SelectItem value="VERIFIED">Verified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedExamId && marks && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Marks</div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Draft</div>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Needs Verification</div>
            <div className="text-2xl font-bold text-amber-600">{stats.submitted}</div>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Verified</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.verified}</div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedExamId && marks && stats.submitted > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-foreground mb-1">Bulk Verification Available</h3>
              <p className="text-xs text-muted-foreground">
                {stats.submitted} mark{stats.submitted !== 1 ? 's' : ''} ready for verification
              </p>
            </div>
            <Button
              onClick={handleVerifyAllSubmitted}
              disabled={verifyAllSubmittedMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {verifyAllSubmittedMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify All Submitted
            </Button>
          </div>
        </div>
      )}

      {/* Marks Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/80 bg-muted/20">
          <h3 className="font-bold text-xs uppercase text-muted-foreground">
            Mark Records {marks && `(${marks.length})`}
          </h3>
        </div>

        {!selectedExamId ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Select an exam to view marks for verification
            </p>
          </div>
        ) : isLoadingMarks ? (
          <SanskarLoader message="Loading marks..." />
        ) : !marks || marks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No marks found for the selected filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">Student</TableHead>
                  <TableHead className="w-[15%]">Subject</TableHead>
                  <TableHead className="w-[10%]">Component</TableHead>
                  <TableHead className="w-[8%] text-center">Marks</TableHead>
                  <TableHead className="w-[12%]">Entered By</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[12%]">Verified By</TableHead>
                  <TableHead className="w-[10%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((mark) => (
                  <TableRow key={mark.id} className="hover:bg-muted/10">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{mark.syncedStudent.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Roll: {mark.syncedStudent.rollNumber} | Section: {mark.syncedStudent.section || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {mark.component.subjectConfig.syncedSubject.name}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {mark.component.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {mark.isAbsent ? (
                        <span className="text-xs text-red-600 font-semibold">ABSENT</span>
                      ) : (
                        <span className="font-mono text-sm font-bold text-foreground">
                          {mark.marksObtained}/{mark.component.fullMarks}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span>{mark.enteredBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(mark.status)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {mark.verifiedBy?.name || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {mark.status === "SUBMITTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifySingle(mark.id)}
                          disabled={verifySingleMutation.isPending}
                          className="text-xs"
                        >
                          {verifySingleMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verify
                            </>
                          )}
                        </Button>
                      )}
                      {mark.status === "VERIFIED" && (
                        <span className="text-xs text-emerald-600">✓ Done</span>
                      )}
                      {mark.status === "DRAFT" && (
                        <span className="text-xs text-muted-foreground">Not submitted</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
