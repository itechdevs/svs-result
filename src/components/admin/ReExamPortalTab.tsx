"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertCircle,
  Clock,
  CalendarCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudentEvaluationResults } from "@/hooks/use-evaluations";
import { useStudents } from "@/hooks/use-students";
import { useProfile } from "@/hooks/use-profile";
import { useSubjects } from "@/hooks/use-subjects";
import { useReExamSchedules } from "@/hooks/use-re-exams";
import { SyncedStudent } from "@/hooks/use-students";
import ReExamPortalSkeleton from "@/components/admin/ReExamPortalSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { buttonVariants } from "@/components/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/ui/table";

const PAGE_SIZE = 10;

export default function ReExamPortalTab() {
  const { data: profile } = useProfile();
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    limit: 500,
  });
  const { data: resultsData = [], isLoading: resultsLoading } =
    useStudentEvaluationResults({ limit: 2000 });
  const { data: subjectsData = [], isLoading: subjectsLoading } = useSubjects();
  const { data: scheduledReExams = [] } = useReExamSchedules("SCHEDULED");

  const [selectedClass, setSelectedClass] = useState("_all");
  const [selectedSubject, setSelectedSubject] = useState("_all");
  const [page, setPage] = useState(1);

  // Assigned classes from teacher profile (or all classes if ADMIN)
  const assignedClasses = useMemo(() => {
    if (!profile || !subjectsData) return [];
    if (profile?.role === "ADMIN") {
      return Array.from(new Set(subjectsData.map((s) => s.gradeLevel)));
    }
    if (!profile?.syncedTeacher?.subjects) return [];
    return Array.from(
      new Set(profile.syncedTeacher.subjects.map((s) => s.gradeLevel)),
    );
  }, [profile, subjectsData]);

  // Subjects for the selected class
  const subjectsForSelectedClass = useMemo(() => {
    if (selectedClass === "_all" || !subjectsData) return [];
    if (profile?.role === "ADMIN") {
      return subjectsData
        .filter((s) => s.gradeLevel === selectedClass)
        .map((s) => s.name);
    }
    if (!profile?.syncedTeacher?.subjects) return [];
    return profile.syncedTeacher.subjects
      .filter((s) => s.gradeLevel === selectedClass)
      .map((s) => s.name);
  }, [selectedClass, profile, subjectsData]);

  const studentsMap = useMemo(() => {
    const map: Record<string, SyncedStudent> = {};
    studentsData?.students.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [studentsData]);

  // Compute failed items: results where marksObtained < passMarks on the template
  const failedItems = useMemo(() => {
    return resultsData
      .filter((r) => {
        if (r.marksObtained === null || r.marksObtained === undefined)
          return false;
        const passMarks = r.evaluationTemplate?.passMarks ?? 0;
        return r.marksObtained < passMarks;
      })
      .map((r) => {
        const rawName = r.evaluationTemplate?.name ?? "";
        const newFmt = rawName.match(/^\[([^\]]+)\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFmt = rawName.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFmt
          ? newFmt[2]
          : legacyFmt
            ? legacyFmt[1]
            : rawName;
        const subTask = newFmt ? newFmt[3] : legacyFmt ? legacyFmt[2] : rawName;
        const subjectName =
          (
            r.evaluationTemplate as unknown as {
              syncedSubject?: { name: string };
            }
          )?.syncedSubject?.name ?? "—";

        return {
          studentId: r.syncedStudentId,
          studentName:
            r.syncedStudent?.name ??
            studentsMap[r.syncedStudentId]?.name ??
            "Unknown",
          rollNumber:
            r.syncedStudent?.rollNumber ??
            studentsMap[r.syncedStudentId]?.rollNumber ??
            "—",
          grade:
            r.syncedStudent?.class ??
            studentsMap[r.syncedStudentId]?.class ??
            "—",
          subject: subjectName,
          taskType,
          subTask,
          evaluationId: r.evaluationTemplateId,
          resultId: r.id,
          marksObtained: r.marksObtained,
          passMarks: r.evaluationTemplate?.passMarks ?? 0,
          fullMarks: r.evaluationTemplate?.fullMarks ?? 0,
          reExamMarks: r.reExamResult?.marksObtained ?? null,
        };
      });
  }, [resultsData, studentsMap]);

  // Apply class + subject filters
  const filteredItems = useMemo(() => {
    let items = failedItems;
    if (selectedClass !== "_all")
      items = items.filter((f) => f.grade === selectedClass);
    if (selectedSubject !== "_all")
      items = items.filter((f) => f.subject === selectedSubject);
    return items;
  }, [failedItems, selectedClass, selectedSubject]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubject("_all");
    setPage(1);
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setPage(1);
  };

  const isLoading = studentsLoading || resultsLoading || subjectsLoading;

  if (isLoading) {
    return <ReExamPortalSkeleton />;
  }

  return (
    <motion.div
      key="re-exam-portal-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Re-Examination Management
          </h1>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Filter by Class
            </label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Classes</SelectItem>
                {assignedClasses.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Filter by Subject
            </label>
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Subjects</SelectItem>
                {subjectsForSelectedClass.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-destructive/5 border border-destructive/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Total Failed
            </p>
            <h4 className="text-2xl font-extrabold text-destructive mt-1">
              {filteredItems.length} Students
            </h4>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Pending Grading
            </p>
            <h4 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {filteredItems.length} Pending
            </h4>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Scheduled
            </p>
            <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {scheduledReExams.length} Scheduled
            </h4>
          </div>
        </div>
      </div>

      {/* Failed Students Table */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground">
              Failed Students Registry
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {filteredItems.length} student
              {filteredItems.length !== 1 ? "s" : ""} · Click View to enter
              re-exam marks
            </p>
          </div>
          {totalPages > 1 && (
            <span className="text-[11px] text-muted-foreground">
              Page {page} of {totalPages}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-[40px]">
                SN
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Student
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Class
              </TableHead>

              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Task / Outcome
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Marks
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 text-center">
                Re-Exam
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No failed students found matching the current filters.
                </TableCell>
              </TableRow>
            ) : (
              pagedItems.map((item, idx) => {
                const viewHref =
                  profile?.role === "ADMIN"
                    ? `/admin/re-exam-portal/${item.studentId}/${item.evaluationId}`
                    : `/teacher/re-exam-portal/${item.studentId}/${item.evaluationId}`;

                const percentage =
                  item.fullMarks > 0
                    ? Math.round(
                      (Number(item.marksObtained) / Number(item.fullMarks)) *
                      100,
                    )
                    : 0;

                return (
                  <TableRow
                    key={`${item.studentId}-${item.evaluationId}`}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* SN */}
                    <TableCell className="text-[11px] font-semibold text-muted-foreground">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </TableCell>

                    {/* Student */}
                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">
                        {item.studentName}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {item.rollNumber}
                      </div>
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <span className="text-xs bg-muted text-muted-foreground font-semibold px-2 py-1 rounded-md">
                        {item.grade}
                      </span>
                    </TableCell>

                    {/* Task / Outcome */}
                    <TableCell className="max-w-[200px]">
                      <div
                        className="text-xs font-semibold text-foreground truncate"
                        title={item.taskType}
                      >
                        {item.taskType}
                      </div>
                      <div
                        className="text-[10px] text-muted-foreground truncate mt-0.5"
                        title={item.subTask}
                      >
                        {item.subTask}
                      </div>
                    </TableCell>

                    {/* Marks */}
                    <TableCell className="text-center">
                      <div className="text-sm font-bold text-destructive">
                        {item.marksObtained} / {item.passMarks}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {percentage}%
                      </div>
                    </TableCell>

                    {/* Re-Exam Marks */}
                    <TableCell className="text-center">
                      {item.reExamMarks !== null ? (
                        <div className={`text-sm font-bold ${item.reExamMarks >= item.passMarks ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                          {item.reExamMarks} / {item.passMarks}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        ✗ Failed
                      </span>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center">
                      <Link
                        href={viewHref}
                        className={cn(
                          buttonVariants({ size: "sm", variant: "default" }),
                          "h-8 text-xs gap-1.5",
                        )}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-2 bg-muted/20">
            <p className="text-[11px] text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredItems.length)} of{" "}
              {filteredItems.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                    acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-1 text-muted-foreground text-xs"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md text-xs font-semibold transition-colors border",
                        page === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
