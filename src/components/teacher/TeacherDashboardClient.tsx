"use client";

import { motion } from "motion/react";
import { ClipboardList, PenLine, ClipboardX, CheckCircle2, Clock } from "lucide-react";

const pendingEvaluations = [
  { subject: "Mathematics", dueDate: "Jun 12", status: "pending" },
  { subject: "Physics", dueDate: "Jun 14", status: "in-progress" },
  { subject: "Chemistry", dueDate: "Jun 18", status: "pending" },
];

const recentActivity = [
  { action: "Marks submitted", subject: "English", time: "2 hrs ago" },
  { action: "Re-exam scheduled", subject: "Biology", time: "Yesterday" },
  { action: "Evaluation created", subject: "Mathematics", time: "2 days ago" },
];

export default function TeacherDashboardClient() {
  return (
    <motion.div
      key="teacher-dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Teacher Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your workload and assignment overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Assigned Evaluations</span>
          </div>
          <div className="text-3xl font-bold text-[#002045] dark:text-white">8</div>
          <div className="text-xs text-slate-400 mt-1">3 pending submission</div>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Marks Pending</span>
          </div>
          <div className="text-3xl font-bold text-[#002045] dark:text-white">24</div>
          <div className="text-xs text-slate-400 mt-1">Students awaiting grades</div>
        </div>

        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <ClipboardX className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Re-Exam Tasks</span>
          </div>
          <div className="text-3xl font-bold text-[#002045] dark:text-white">5</div>
          <div className="text-xs text-slate-400 mt-1">2 scheduled this week</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Evaluations */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#002045] dark:text-white text-base mb-4">Pending Marking Tasks</h2>
          <div className="space-y-3">
            {pendingEvaluations.map((ev, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#002045] dark:text-white">{ev.subject}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Due {ev.dueDate}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  ev.status === "in-progress"
                    ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600"
                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                }`}>
                  {ev.status === "in-progress" ? "In Progress" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm p-6">
          <h2 className="font-bold text-[#002045] dark:text-white text-base mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#002045] dark:text-white">{item.action}</p>
                  <p className="text-xs text-slate-400">{item.subject} · {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
