"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  useEvaluationTemplates,
  useStudentEvaluationResults,
} from "@/hooks/use-evaluations";
import { useProfile } from "@/hooks/use-profile";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import {
  ClipboardList,
  AlertCircle,
  ArrowRight,
  PenLine,
  MessageSquareText,
} from "lucide-react";
import TeacherDashboardSkeleton from "@/components/teacher/TeacherDashboardSkeleton";

/**
 * Look up school level for a subject's gradeLevel+section.
 * Tries: exact key → "grade - section" → "grade section" → fallback PRIMARY.
 */
function getSchoolLevel(
  gradeLevel: string,
  dbMap: Map<string, string>,
  section?: string | null,
): string {
  const exact = dbMap.get(gradeLevel);
  if (exact) return exact;
  if (section) {
    const dashMatch = dbMap.get(`${gradeLevel} - ${section}`);
    if (dashMatch) return dashMatch;
    const spaceMatch = dbMap.get(`${gradeLevel} ${section}`);
    if (spaceMatch) return spaceMatch;
  }
  return "PRIMARY";
}

export default function DashboardPage() {
  const { data: templatesData = [], isLoading: isTemplatesLoading } =
    useEvaluationTemplates();
  const { data: allResults = [], isLoading: isResultsLoading } =
    useStudentEvaluationResults({
      limit: 1000,
    });
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: categories } = useGradeLevelCategories();

  const isLoading =
    isTemplatesLoading ||
    isResultsLoading ||
    isProfileLoading;

  const dbMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories ?? []) {
      map.set(c.gradeLevel, c.schoolLevel);
    }
    return map;
  }, [categories]);

  const assignedSubjectIds = useMemo(() => {
    return new Set(profile?.syncedTeacher?.subjects.map((s) => s.id) ?? []);
  }, [profile]);

  const subjectsByLevel = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    const grouped: Record<string, typeof subjects> = {
      PRE_PRIMARY: [],
      PRIMARY: [],
      SECONDARY: [],
      HIGHER: [],
    };
    for (const s of subjects) {
      const level = getSchoolLevel(s.gradeLevel, dbMap, s.section);
      if (level === "PRE_PRIMARY" || level === "PRIMARY" || level === "SECONDARY" || level === "HIGHER") {
        grouped[level].push(s);
      } else {
        grouped.PRIMARY.push(s);
      }
    }
    return grouped;
  }, [profile, dbMap]);

  const filteredTemplates = useMemo(() => {
    if (!profile?.syncedTeacher) return [];
    return templatesData.filter((t) =>
      assignedSubjectIds.has(t.syncedSubjectId),
    );
  }, [templatesData, profile, assignedSubjectIds]);

  const evalCountByLevel = useMemo(() => {
    const counts: Record<string, number> = {
      PRE_PRIMARY: 0,
      PRIMARY: 0,
      SECONDARY: 0,
      HIGHER: 0,
    };
    for (const t of filteredTemplates) {
      const gradeLevel = t.gradeConfig?.gradeLevel ?? t.syncedSubject?.gradeLevel ?? "";
      // Templates don't carry section; try exact match first, section-less lookup second
      const level = getSchoolLevel(gradeLevel, dbMap, null);
      if (level === "PRE_PRIMARY" || level === "PRIMARY" || level === "SECONDARY" || level === "HIGHER") {
        counts[level]++;
      } else {
        counts.PRIMARY++;
      }
    }
    return counts;
  }, [filteredTemplates, dbMap]);

  const pendingReExam = useMemo(() => {
    if (!profile?.syncedTeacher) return 0;
    const validTemplateIds = new Set(filteredTemplates.map((t) => t.id));
    const grouped = new Set<string>();
    for (const r of allResults) {
      if (r.marksObtained === null || r.marksObtained === undefined) continue;
      if (!validTemplateIds.has(r.evaluationTemplateId)) continue;
      const passMarks = Number(r.evaluationTemplate?.passMarks ?? 0);
      if (Number(r.marksObtained) >= passMarks) continue;
      if (r.reExamResult != null) continue;
      const rawName = r.evaluationTemplate?.name ?? '';
      const newFmt = rawName.match(/^\[([^\]]+)\]\[/);
      const evalTitle = newFmt ? newFmt[1] : undefined;
      const template = r.evaluationTemplate as unknown as { examId?: string | null };
      const cardId = template?.examId ?? evalTitle ?? r.evaluationTemplateId;
      grouped.add(`${r.syncedStudentId}|${cardId}`);
    }
    return grouped.size;
  }, [allResults, filteredTemplates, profile]);

  const isClassTeacher = !!profile?.syncedTeacher?.classTeacherId;
  const hasPrePrimary = subjectsByLevel.PRE_PRIMARY.length > 0;
  const hasPrimary = subjectsByLevel.PRIMARY.length > 0;
  const hasSecondary = subjectsByLevel.SECONDARY.length > 0;
  const hasHigher = subjectsByLevel.HIGHER.length > 0;

  const recentEvaluations = filteredTemplates.slice(0, 4);

  const kpis: {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    danger: boolean;
    href?: string;
    colorClass: string;
    show: boolean;
  }[] = [
    {
      label: "Pre-Primary Evaluations",
      value: String(evalCountByLevel.PRE_PRIMARY),
      sub: hasPrePrimary 
        ? `${subjectsByLevel.PRE_PRIMARY.length} subject${subjectsByLevel.PRE_PRIMARY.length !== 1 ? "s" : ""}`
        : "No pre-primary subjects",
      icon: <MessageSquareText className="w-5 h-5" />,
      danger: false,
      colorClass: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40",
      show: hasPrePrimary,
    },
    {
      label: "Primary Evaluations",
      value: String(evalCountByLevel.PRIMARY),
      sub: hasPrimary
        ? `${subjectsByLevel.PRIMARY.length} subject${subjectsByLevel.PRIMARY.length !== 1 ? "s" : ""}`
        : "No primary subjects",
      icon: <ClipboardList className="w-5 h-5" />,
      danger: false,
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40",
      show: hasPrimary,
    },
    {
      label: "Pending Re-Exams",
      value: String(pendingReExam),
      sub: pendingReExam > 0 ? "Require action" : "All clear",
      icon: <AlertCircle className="w-5 h-5" />,
      danger: true,
      href: "/teacher/re-exam-portal",
      colorClass: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40",
      show: hasPrePrimary || hasPrimary,
    },
    {
      label: "Secondary Subjects",
      value: String(subjectsByLevel.SECONDARY.length),
      sub: hasSecondary ? "Mark entry required" : "No secondary subjects",
      icon: <PenLine className="w-5 h-5" />,
      danger: false,
      href: "/teacher/secondary/mark-entry",
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40",
      show: hasSecondary,
    },
    {
      label: "Higher Subjects",
      value: String(subjectsByLevel.HIGHER.length),
      sub: hasHigher ? "Mark entry required" : "No higher subjects",
      icon: <PenLine className="w-5 h-5" />,
      danger: false,
      href: "/teacher/secondary/mark-entry",
      colorClass: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
      show: hasHigher,
    },
  ];

  const visibleKpis = kpis.filter((k) => k.show);

  if (isLoading) {
    return <TeacherDashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Welcome back, here's what's happening with your classes.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {visibleKpis.map((kpi) => {
          const content = (
            <div
              key={kpi.label}
              className="bg-card rounded-xl border border-border p-4 sm:p-5 relative overflow-hidden hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between min-h-[90px]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                    {kpi.label}
                  </p>
                  <p
                    className={`text-2xl sm:text-3xl font-extrabold ${kpi.danger ? "text-destructive" : "text-foreground"}`}
                  >
                    {kpi.value}
                  </p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-xl ${kpi.colorClass}`}>
                  {kpi.icon}
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {kpi.sub}
                </p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </div>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href}>
              {content}
            </Link>
          ) : (
            <div key={kpi.label}>{content}</div>
          );
        })}
        {visibleKpis.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
            No subjects assigned yet. Contact your administrator.
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
        {/* Evaluations table */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col w-full">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">
              Recent Evaluations
            </h2>
            {/* <Link href="/teacher/evaluations" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
              View all →
            </Link> */}
          </div>
          <div className="p-0 overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-3 sm:px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Evaluation Title
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Subject &amp; Class
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentEvaluations.map((ev) => {
                  const newFmt = ev.name.match(
                    /^\[([^\]]+)\]\[([^\]]+)\]\s*(.+)$/,
                  );
                  const legacyFmt = ev.name.match(/^\[([^\]]+)\]\s*(.+)$/);
                  const evalTitleRaw = newFmt
                    ? newFmt[1]
                    : legacyFmt
                      ? legacyFmt[1]
                      : "";
                  const evalTitle = evalTitleRaw.split("|")[0] || ev.name;
                  const taskType = newFmt
                    ? newFmt[2]
                    : legacyFmt
                      ? legacyFmt[1]
                      : "Standard";
                  const subTask = newFmt
                    ? newFmt[3]
                    : legacyFmt
                      ? legacyFmt[2]
                      : ev.name;
                  const gradeLevel = ev.gradeConfig?.gradeLevel ?? "";
                  const subjectName = ev.syncedSubject?.name ?? "";
                  const query = new URLSearchParams({
                    class: gradeLevel,
                    subject: subjectName,
                    eval: evalTitle,
                  });
                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-3 sm:px-5 py-3 sm:py-4">
                        <div className="font-semibold text-sm text-foreground">
                          {evalTitle}
                        </div>
                        <div
                          className="text-[10px] text-muted-foreground mt-0.5 truncate"
                          title={subTask}
                        >
                          {subTask}
                        </div>
                        <div className="sm:hidden mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted text-muted-foreground">
                            {subjectName} {gradeLevel ? `· ${gradeLevel}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-muted text-muted-foreground">
                          {subjectName} {gradeLevel ? `· ${gradeLevel}` : ""}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                        <Link
                          href={`/teacher/mark-entry?${query.toString()}`}
                          className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {recentEvaluations.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-sm text-muted-foreground"
                    >
                      No recent evaluations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Re-exam alerts */}
        {/* <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border bg-destructive/5 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-sm font-bold text-destructive">
              Re-Exam Alerts
            </h2>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <p className="text-xs text-muted-foreground mb-4">
              Students with NG / Fail status requiring re-exam scheduling or
              mark entry.
            </p>
            <div className="flex flex-col gap-3 flex-1">
              {reExamAlerts.map((s) => {
                const newFmt = s.evaluationTemplate?.name.match(
                  /^\[([^\]]+)\]\[([^\]]+)\]\s*(.+)$/,
                );
                const legacyFmt = s.evaluationTemplate?.name.match(
                  /^\[([^\]]+)\]\s*(.+)$/,
                );
                const evalTitleRaw = newFmt
                  ? newFmt[1]
                  : legacyFmt
                    ? legacyFmt[1]
                    : "";
                const evalTitle =
                  evalTitleRaw.split("|")[0] ||
                  (s.evaluationTemplate?.name ?? "Re-Exam");
                const taskType = newFmt
                  ? newFmt[2]
                  : legacyFmt
                    ? legacyFmt[1]
                    : "Standard";
                const subTask = newFmt
                  ? newFmt[3]
                  : legacyFmt
                    ? legacyFmt[2]
                    : (s.evaluationTemplate?.name ?? "Re-Exam");
                return (
                  <div
                    key={s.id}
                    className="border border-border rounded-xl p-3 bg-muted/20 hover:border-destructive/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-xs font-bold text-foreground truncate"
                          title={evalTitle}
                        >
                          {evalTitle}
                        </span>
                        <span
                          className="text-[10px] text-muted-foreground truncate mt-0.5"
                          title={`${taskType}: ${subTask}`}
                        >
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            {taskType}
                          </span>
                          : {subTask}
                        </span>
                      </div>
                      <Link
                        href="/teacher/re-exam-portal"
                        className="text-[10px] font-bold uppercase tracking-wider bg-background border border-border rounded px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        Schedule
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                      {s.evaluationTemplate?.syncedSubject?.name ?? "—"} ·{" "}
                      {s.status}
                    </div>
                  </div>
                );
              })}
              {reExamAlerts.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                    <ClipboardList className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    All caught up!
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    No pending re-exams.
                  </p>
                </div>
              )}
            </div>
            {reExamAlerts.length > 0 && (
              <>
                <div className="my-4 h-px bg-border" />
                <Link
                  href="/teacher/re-exam-portal"
                  className="text-xs font-semibold text-primary hover:text-primary/80 text-center block"
                >
                  View all re-exams →
                </Link>
              </>
            )}
          </div>
        </div> */}
      </div>
    </motion.div>
  );
}
