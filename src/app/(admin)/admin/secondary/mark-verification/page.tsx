"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { motion } from "motion/react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  BookOpen,
  FileCheck,
  Loader2,
  Filter,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import SanskarLoader from "@/components/shared/SanskarLoader";
import { EditMarksModal } from "@/components/secondary/EditMarksModal";

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

function SecondaryMarkVerificationPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedYear = searchParams.get("year") || "";
  const selectedGrade = searchParams.get("grade") || "";
  const selectedExamId = searchParams.get("exam") || "";
  const statusFilter = (searchParams.get("status") as "ALL" | "DRAFT" | "SUBMITTED" | "VERIFIED") || "SUBMITTED";

  const setQueryParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

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

  // Set default current year and clear exam on grade change
  useEffect(() => {
    if (!selectedYear && currentYear) {
      setQueryParam("year", currentYear.id);
    }
  }, [currentYear, selectedYear, setQueryParam]);



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

  // Edit modal state
  const [editModalData, setEditModalData] = useState<{
    studentName: string;
    rollNumber: string;
    subjectName: string;
    theory: { markId: string; componentType: string; marksObtained: number | null; fullMarks: number; passMarks: number; isAbsent: boolean } | null;
    practical: { markId: string; componentType: string; marksObtained: number | null; fullMarks: number; passMarks: number; isAbsent: boolean } | null;
  } | null>(null);

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

  interface MarkIdInfo {
    id: string;
    status: string;
    componentType: string;
  }

  interface SubjectRow {
    subjectName: string;
    theory: { marksObtained: number; fullMarks: number; passMarks: number; isAbsent: boolean } | null;
    practical: { marksObtained: number; fullMarks: number; passMarks: number; isAbsent: boolean } | null;
    isAbsent: boolean;
    enteredBy: string;
    statuses: string[];
    verifiedBy: string | null;
    markIds: MarkIdInfo[];
  }

  interface StudentGroup {
    studentId: string;
    studentName: string;
    rollNumber: string;
    section: string;
    subjects: SubjectRow[];
    allMarkIds: MarkIdInfo[];
  }

  // Group marks by student, then by subject
  const studentGroups = useMemo(() => {
    if (!marks) return [];

    const studentMap = new Map<string, StudentGroup>();

    // First group by student+subject (same as before)
    const subjectMap = new Map<string, SubjectRow>();

    marks.forEach((mark) => {
      const subjectName = mark.component.subjectConfig.syncedSubject.name;
      const key = `${mark.syncedStudent.id}|${subjectName}`;

      if (!subjectMap.has(key)) {
        subjectMap.set(key, {
          subjectName,
          theory: null,
          practical: null,
          isAbsent: mark.isAbsent,
          enteredBy: mark.enteredBy.name,
          statuses: [],
          verifiedBy: mark.verifiedBy?.name || null,
          markIds: [],
        });
      }

      const row = subjectMap.get(key)!;
      const componentType = mark.component.type.toUpperCase();
      if (componentType === 'THEORY' || componentType === 'TH') {
        row.theory = { marksObtained: Number(mark.marksObtained), fullMarks: Number(mark.component.fullMarks), passMarks: Number(mark.component.passMarks), isAbsent: mark.isAbsent };
      } else if (componentType === 'PRACTICAL' || componentType === 'PR') {
        row.practical = { marksObtained: Number(mark.marksObtained), fullMarks: Number(mark.component.fullMarks), passMarks: Number(mark.component.passMarks), isAbsent: mark.isAbsent };
      }
      row.statuses.push(mark.status);
      row.markIds.push({ id: mark.id, status: mark.status, componentType });
      if (mark.isAbsent) row.isAbsent = true;

      // Group by student
      if (!studentMap.has(mark.syncedStudent.id)) {
        studentMap.set(mark.syncedStudent.id, {
          studentId: mark.syncedStudent.id,
          studentName: mark.syncedStudent.name,
          rollNumber: mark.syncedStudent.rollNumber || '',
          section: mark.syncedStudent.section || '',
          subjects: [],
          allMarkIds: [],
        });
      }
      const studentGroup = studentMap.get(mark.syncedStudent.id)!;
      // Track all mark IDs across all subjects
      if (!studentGroup.allMarkIds.some(m => m.id === mark.id)) {
        studentGroup.allMarkIds.push({ id: mark.id, status: mark.status, componentType: componentType });
      }
    });

    // Assign subjects to each student group
    subjectMap.forEach((row, key) => {
      const studentId = key.split('|')[0];
      const studentGroup = studentMap.get(studentId);
      if (studentGroup) {
        studentGroup.subjects.push(row);
      }
    });

    return Array.from(studentMap.values());
  }, [marks]);

  // Flatten student groups into rows (one per subject per student)
  const flatRows = useMemo(() => {
    const rows: Array<{
      studentGroup: StudentGroup;
      subject: SubjectRow;
      isFirstSubject: boolean;
      rowSpan: number;
    }> = [];

    studentGroups.forEach((group) => {
      group.subjects.forEach((subject, index) => {
        rows.push({
          studentGroup: group,
          subject,
          isFirstSubject: index === 0,
          rowSpan: index === 0 ? group.subjects.length : 0,
        });
      });
    });

    return rows;
  }, [studentGroups]);

  // Compute overall status for a subject
  const getSubjectStatus = (statuses: string[]): "VERIFIED" | "SUBMITTED" | "DRAFT" | "MIXED" => {
    if (statuses.every(s => s === "VERIFIED")) return "VERIFIED";
    if (statuses.every(s => s === "SUBMITTED")) return "SUBMITTED";
    if (statuses.every(s => s === "DRAFT")) return "DRAFT";
    return "MIXED";
  };

  // Compute overall status for a student across all subjects
  const getStudentStatus = (group: StudentGroup): "VERIFIED" | "SUBMITTED" | "DRAFT" | "MIXED" => {
    const allStatuses = group.subjects.flatMap(s => s.statuses);
    if (allStatuses.every(s => s === "VERIFIED")) return "VERIFIED";
    if (allStatuses.every(s => s === "SUBMITTED")) return "SUBMITTED";
    if (allStatuses.every(s => s === "DRAFT")) return "DRAFT";
    return "MIXED";
  };

  const stats = {
    total: studentGroups.length,
    draft: studentGroups.filter(g => getStudentStatus(g) === "DRAFT").length,
    submitted: studentGroups.filter(g => getStudentStatus(g) === "SUBMITTED").length,
    verified: studentGroups.filter(g => getStudentStatus(g) === "VERIFIED").length,
  };

  const handleOpenEdit = (group: StudentGroup, subject: SubjectRow) => {
    const theoryMark = subject.markIds.find(m => m.componentType === 'THEORY' || m.componentType === 'TH');
    const practicalMark = subject.markIds.find(m => m.componentType === 'PRACTICAL' || m.componentType === 'PR');

    setEditModalData({
      studentName: group.studentName,
      rollNumber: group.rollNumber,
      subjectName: subject.subjectName,
      theory: theoryMark && subject.theory ? {
        markId: theoryMark.id,
        componentType: theoryMark.componentType,
        marksObtained: subject.theory.marksObtained,
        fullMarks: subject.theory.fullMarks,
        passMarks: subject.theory.passMarks,
        isAbsent: subject.theory.isAbsent,
      } : null,
      practical: practicalMark && subject.practical ? {
        markId: practicalMark.id,
        componentType: practicalMark.componentType,
        marksObtained: subject.practical.marksObtained,
        fullMarks: subject.practical.fullMarks,
        passMarks: subject.practical.passMarks,
        isAbsent: subject.practical.isAbsent,
      } : null,
    });
  };

  const handleVerifyStudentMarks = (markIds: MarkIdInfo[]) => {
    const submittedIds = markIds.filter(m => m.status === "SUBMITTED").map(m => m.id);
    if (submittedIds.length === 0) {
      toast.warning("No submitted marks to verify for this student");
      return;
    }
    const promises = submittedIds.map(id =>
      apiClient.post(`/admin/secondary/marks/${id}/verify`, { remarks: "Verified by admin" })
    );
    Promise.all(promises)
      .then(() => {
        toast.success(`Verified ${submittedIds.length} mark(s)`);
        refetch();
        queryClient.invalidateQueries({ queryKey: ["secondary-marks-verification"] });
      })
      .catch((error: any) => {
        toast.error(error.message || "Failed to verify marks");
      });
  };

  const getSubjectStatusBadge = (statuses: string[]) => {
    const status = getSubjectStatus(statuses);
    switch (status) {
      case "SUBMITTED":
        return <Badge variant="outline" className="text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />Submitted</Badge>;
      case "VERIFIED":
        return <Badge variant="outline" className="text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "DRAFT":
        return <Badge variant="outline" className="text-gray-600"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
      case "MIXED":
        return <Badge variant="outline" className="text-blue-600">Mixed</Badge>;
    }
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
            <Select value={selectedYear || currentYear?.id} onValueChange={(val) => setQueryParam("year", val)}>
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
            <Select value={selectedGrade} onValueChange={(val) => setQueryParam("grade", val)} disabled={isLoadingGrades}>
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
            <Select value={selectedExamId} onValueChange={(val) => setQueryParam("exam", val)} disabled={isLoadingExams || !selectedGrade}>
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
            <Select value={statusFilter} onValueChange={(v) => setQueryParam("status", v)}>
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
            <div className="text-xs text-muted-foreground mb-1">Total Students</div>
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
                {stats.submitted} student{stats.submitted !== 1 ? 's' : ''} with submitted marks ready for verification
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
            Mark Records {studentGroups && `(${studentGroups.length})`}
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
                  <TableHead className="w-[8%] text-center">Theory</TableHead>
                  <TableHead className="w-[8%] text-center">Practical</TableHead>
                  <TableHead className="w-[8%] text-center">Total</TableHead>
                  <TableHead className="w-[10%]">Entered By</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[10%]">Verified By</TableHead>
                  <TableHead className="w-[10%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flatRows.map((row, idx) => {
                  const { subject, studentGroup, isFirstSubject, rowSpan } = row;
                  const totalObtained = (subject.theory?.marksObtained || 0) + (subject.practical?.marksObtained || 0);
                  const totalFull = (subject.theory?.fullMarks || 0) + (subject.practical?.fullMarks || 0);
                  const canVerify = studentGroup.allMarkIds.some(m => m.status === "SUBMITTED");
                  const studentStatus = getStudentStatus(studentGroup);

                  return (
                    <TableRow key={`${studentGroup.studentId}|${subject.subjectName}`} className="hover:bg-muted/10">
                      {isFirstSubject && (
                        <TableCell rowSpan={rowSpan} className="align-top">
                          <div>
                            <p className="font-medium text-sm text-foreground">{studentGroup.studentName}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Roll: {studentGroup.rollNumber} | Section: {studentGroup.section || 'N/A'}
                            </p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-xs font-semibold">
                        {subject.subjectName}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {subject.theory?.isAbsent ? (
                            <span className="text-xs text-red-600 font-semibold">ABS</span>
                          ) : subject.theory ? (
                            <span className="font-mono text-sm font-bold text-foreground">
                              {subject.theory.marksObtained}/{subject.theory.fullMarks}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {subject.markIds.length > 0 && (
                            <button
                              onClick={() => handleOpenEdit(studentGroup, subject)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit marks"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {subject.practical?.isAbsent ? (
                            <span className="text-xs text-red-600 font-semibold">ABS</span>
                          ) : subject.practical ? (
                            <span className="font-mono text-sm font-bold text-foreground">
                              {subject.practical.marksObtained}/{subject.practical.fullMarks}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {subject.markIds.length > 0 && (
                            <button
                              onClick={() => handleOpenEdit(studentGroup, subject)}
                              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit marks"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(subject.theory && !subject.theory.isAbsent) || (subject.practical && !subject.practical.isAbsent) ? (
                          <span className="font-mono text-sm font-bold text-primary">
                            {totalObtained}/{totalFull}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-semibold">ABSENT</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span>{subject.enteredBy}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubjectStatusBadge(subject.statuses)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {subject.verifiedBy || '—'}
                      </TableCell>
                      {isFirstSubject && (
                        <TableCell rowSpan={rowSpan} className="align-middle text-right">
                          {canVerify ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyStudentMarks(studentGroup.allMarkIds)}
                              className="text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verify
                            </Button>
                          ) : studentStatus === "VERIFIED" ? (
                            <span className="text-xs text-emerald-600">✓ Done</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Marks Modal */}
      <EditMarksModal
        open={!!editModalData}
        onClose={() => setEditModalData(null)}
        studentName={editModalData?.studentName ?? ""}
        rollNumber={editModalData?.rollNumber ?? ""}
        subjectName={editModalData?.subjectName ?? ""}
        theory={editModalData?.theory ?? null}
        practical={editModalData?.practical ?? null}
        onSaved={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["secondary-marks-verification"] });
        }}
      />
    </motion.div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SanskarLoader message="Loading..." />}>
      <SecondaryMarkVerificationPage />
    </Suspense>
  );
}
