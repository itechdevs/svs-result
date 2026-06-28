"use client";

import { motion } from "motion/react";
import { Users, FileText, Send, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import SyncManagementClient from "@/components/admin/SyncManagementClient";
import AdminDashboardSkeleton from "@/components/admin/AdminDashboardSkeleton";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

const fallbackData = {
  academicYear: { id: "", name: "No Academic Year" },
  students: { total: 0 },
  teachers: { total: 0 },
  results: { byStatus: {}, passCount: 0, failCount: 0, totalCount: 0, passPercentage: 0, failPercentage: 0, published: 0, marksheetsGenerated: 0 },
  evaluations: { pendingSubmission: 0, pendingVerification: 0 },
  reExams: { total: 0, byStatus: {} as Record<string, number> },
  classPerformance: [] as { grade: string; averageGpa: number; studentCount: number }[],
};

export default function AdminDashboardClient() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const safe = data?.results ? data : fallbackData;
  const classPerformance = safe.classPerformance;
  const maxGpa = 4.0;
  const completionRate =
    safe.results.marksheetsGenerated > 0
      ? Math.round(
          (safe.results.published / safe.results.marksheetsGenerated) * 100,
        )
      : 0;

  const barColors = [
    "bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300",
    "bg-gradient-to-t from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300",
    "bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300",
    "bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300",
    "bg-gradient-to-t from-amber-600 to-amber-400 dark:from-amber-500 dark:to-amber-300",
    "bg-gradient-to-t from-rose-600 to-rose-400 dark:from-rose-500 dark:to-rose-300",
    "bg-gradient-to-t from-cyan-600 to-cyan-400 dark:from-cyan-500 dark:to-cyan-300",
    "bg-gradient-to-t from-orange-600 to-orange-400 dark:from-orange-500 dark:to-orange-300",
  ];

  return (
    <motion.div
      key="admin-dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {safe.academicYear.name} — Overview of academic performance and
            results
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Total Students
            </div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/25 flex items-center justify-center border border-primary/20 dark:border-primary/40 text-primary dark:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight">
              {safe.students.total.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 h-1 bg-primary rounded-full w-16 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* Total Teachers */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Teachers
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/25 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight">
              {safe.teachers.total.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 h-1 bg-emerald-600 rounded-full w-16 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* Re-Exam Required */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Re-Exam Req.
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/25 flex items-center justify-center border border-amber-500/20 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {safe.reExams.total}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground font-medium">
            <span className="text-destructive font-bold">
              {safe.reExams.byStatus.SCHEDULED ?? 0} Scheduled
            </span>
          </div>
        </div>

        {/* Published Results */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">
              Published Results
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/20 dark:bg-white/15 flex items-center justify-center border border-white/20 dark:border-white/30 text-white group-hover:bg-white group-hover:text-primary transition-all duration-300">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight ">
            {safe.results.published} / {safe.results.marksheetsGenerated}
          </div>
          <div className="mt-2 text-xs ">{completionRate}% Completion Rate</div>
        </div>
      </div>

      {/* Class-wise Performance */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-foreground">
              Class-wise Performance
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Average GPA Comparison across Classes
            </p>
          </div>
          <span className="text-xs font-semibold text-primary dark:text-primary-foreground bg-primary/10 dark:bg-primary/25 px-3 py-1.5 rounded-lg border border-primary/20 dark:border-primary/40 self-start sm:self-auto whitespace-nowrap">
            {safe.academicYear.name}
          </span>
        </div>

        <div className="flex items-end justify-between gap-4 h-64">
          {classPerformance.length === 0 ? (
            <div className="w-full text-center text-muted-foreground text-sm py-16">
              No class performance data available yet.
            </div>
          ) : (
            classPerformance.map((item, index) => {
              const heightPercent = (item.averageGpa / maxGpa) * 100;
              return (
                <div
                  key={item.grade}
                  className="flex-1 flex flex-col items-center gap-3"
                >
                  <div
                    className="w-full flex items-end justify-center"
                    style={{ height: "200px" }}
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={cn(
                        barColors[index % barColors.length],
                        "w-full rounded-t-lg relative group cursor-pointer transition-all hover:opacity-90 shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.1)] hover:shadow-lg",
                      )}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-card text-card-foreground border border-border text-[11px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                          GPA: {item.averageGpa}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {item.grade}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Data Synchronization */}
      <SyncManagementClient />
    </motion.div>
  );
}
