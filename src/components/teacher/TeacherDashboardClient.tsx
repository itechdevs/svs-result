"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Bell,
} from "lucide-react";
import {
  useEvaluationTemplates,
  useStudentEvaluationResults,
} from "@/hooks/use-evaluations";
import { useReExamSchedules } from "@/hooks/use-re-exams";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KPI_ICONS = [ClipboardList, AlertTriangle, CalendarClock];

export default function TeacherDashboardClient() {
  const { data: templatesData = [] } = useEvaluationTemplates();
  const { data: reExamData = [] } = useReExamSchedules("SCHEDULED");
  const { data: allResults = [] } = useStudentEvaluationResults({
    limit: 1000,
  });
  const { data: profile } = useProfile();

  // Total Evaluations: same grouping logic as EvaluationsTab — one card per distinct eval plan
  const totalEvaluations = useMemo(() => {
    const assignedSubjectIds = new Set(
      profile?.syncedTeacher?.subjects.map((s) => s.id) ?? [],
    );
    const filtered =
      assignedSubjectIds.size > 0
        ? templatesData.filter((t) => assignedSubjectIds.has(t.syncedSubjectId))
        : templatesData;
    const keys = new Set(
      filtered.map((t) => {
        const evalTitleMatch = t.name.match(/^\[([^\]]+)\]\[/);
        const rawEvalPart = evalTitleMatch ? evalTitleMatch[1] : "__legacy__";
        const evalTitle = rawEvalPart.split("|")[0];
        return `${t.gradeConfigId}::${t.syncedSubjectId}::${evalTitle}`;
      }),
    );
    return keys.size;
  }, [templatesData, profile]);

  // Pending Re-Exam: same logic as MarkEntryOverviewTable — students where isPassed === false
  const pendingReExam = useMemo(
    () => allResults.filter((r) => r.isPassed === false).length,
    [allResults],
  );

  // Re-Exam Scheduled: count of SCHEDULED re-exam records (source for ReExamDetailedView entries)
  const reExamScheduled = reExamData.length;

  const recentEvaluations = templatesData.slice(0, 4);
  const reExamAlerts = reExamData
    .filter((r) => r.status !== "SCHEDULED")
    .slice(0, 2);

  const kpis = [
    {
      label: "Total evaluations",
      value: String(totalEvaluations),
      sub: "Completed this semester",
      icon: "📋",
      danger: false,
      href: "/teacher/evaluations",
    },
    {
      label: "Pending re-exams",
      value: String(pendingReExam),
      sub: "Require action",
      icon: "⚠️",
      danger: true,
      href: "/teacher/re-exam-portal",
    },
    {
      label: "Re-exams scheduled",
      value: String(reExamScheduled),
      sub: "Upcoming this week",
      icon: "📅",
      danger: false,
      href: "/teacher/re-exam-portal",
    },
  ];

  return (
    <motion.div
      key="teacher-dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your teaching activity and pending actions
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = KPI_ICONS[i];
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={cn(
                "group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1",
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-xs font-semibold text-muted-foreground">
                  {kpi.label}
                </div>
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                    kpi.danger
                      ? "bg-destructive/10 border-destructive/20 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground"
                      : "bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  kpi.danger ? "text-destructive" : "text-foreground",
                )}
              >
                {kpi.value}
              </div>
              <div className="mt-3 h-1 rounded-full w-16 group-hover:w-full transition-all duration-500 bg-primary" />
              <p className="text-xs text-muted-foreground mt-2">{kpi.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluations table */}
        <div className="lg:col-span-2 bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-lg text-foreground">
                Recent Evaluations
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Your latest evaluation plans
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/teacher/evaluations">View all →</Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-left text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Evaluation Title
                </TableHead>
                <TableHead className="text-left text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Subject
                </TableHead>
                <TableHead className="text-center text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground text-sm"
                  >
                    No evaluations found.
                  </TableCell>
                </TableRow>
              ) : (
                recentEvaluations.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3 text-foreground font-medium">
                      {ev.name}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs bg-muted text-muted-foreground rounded-md px-2 py-1">
                        {ev.syncedSubject?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        variant="link"
                        size="sm"
                        asChild
                        className="text-xs text-primary hover:text-primary/80 font-medium p-0 h-auto"
                      >
                        <Link
                          href="/teacher/mark-entry"
                          className="inline-flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-3 h-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Re-exam alerts */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-bold text-foreground">
              Re-Exam Alerts
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Students with NG / Fail status requiring re-exam scheduling.
          </p>

          <div className="flex flex-col gap-3 flex-1">
            {reExamAlerts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                No pending alerts.
              </div>
            ) : (
              reExamAlerts.map((s) => (
                <div
                  key={s.id}
                  className="bg-muted/40 border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {s.evaluationTemplate?.name ?? "Re-Exam"}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/teacher/re-exam-portal">Schedule</Link>
                    </Button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" />
                    {s.evaluationTemplate?.syncedSubject?.name ?? "—"} ·{" "}
                    {s.status}
                  </div>
                </div>
              ))
            )}
          </div>

          <hr className="my-4 border-border" />
          <Button
            variant="link"
            size="sm"
            asChild
            className="text-xs text-primary hover:text-primary/80 font-medium w-full text-center block p-0 h-auto"
          >
            <Link href="/teacher/re-exam-portal">View all re-exams →</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
