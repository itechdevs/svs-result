"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAcademicContext } from "@/contexts/AcademicContext";

export default function DashboardPage() {
  const { evaluations, reExams } = useAcademicContext();

  const reExamStats = useMemo(() => {
    const scheduled = reExams.filter(r => r.status === 'SCHEDULED').length;
    const pending = reExams.filter(r => r.status !== 'SCHEDULED').length;
    return { scheduled, pending, total: reExams.length };
  }, [reExams]);

  const recentEvaluations = evaluations.slice(0, 4);
  const reExamStudents = reExams.filter(r => r.status !== 'SCHEDULED').slice(0, 2);

  const kpis = [
    { label: "Total evaluations", value: String(evaluations.length), sub: "Completed this semester", icon: "📋", danger: false, href: "/teacher/evaluations" },
    { label: "Pending re-exams", value: String(reExamStats.pending), sub: "Require action", icon: "⚠️", danger: true, href: "/teacher/re-exam-portal" },
    { label: "Re-exams scheduled", value: String(reExamStats.scheduled), sub: "Upcoming this week", icon: "📅", danger: false, href: "/teacher/re-exam-portal" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              {kpi.label}
            </p>
            <p
              className={`text-3xl font-semibold ${kpi.danger ? "text-red-600" : "text-gray-900"
                }`}
            >
              {kpi.value}
            </p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
            <span className="absolute top-4 right-4 text-xl">{kpi.icon}</span>
          </Link>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Evaluations table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Evaluations</h2>
            <Link href="/teacher/evaluations" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-2 font-medium">
                  Evaluation title
                </th>
                <th className="text-left text-xs text-gray-400 uppercase tracking-wide pb-2 font-medium">
                  Subject
                </th>
                <th className="text-center text-xs text-gray-400 uppercase tracking-wide pb-2 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEvaluations.map((ev) => (
                <tr key={ev.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 text-gray-800">{ev.title}</td>
                  <td className="py-3">
                    <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-1">
                      {ev.subject}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <Link href="/teacher/mark-entry" className="text-gray-400 hover:text-gray-700 transition-colors px-2">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Re-exam alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500 text-lg">🔔</span>
            <h2 className="text-sm font-semibold text-red-700">Re-Exam Alerts</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Students with NG / Fail status requiring re-exam scheduling.
          </p>

          <div className="flex flex-col gap-3">
            {reExamStudents.map((s) => (
              <div
                key={s.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {s.name}
                  </span>
                  <Link
                    href="/teacher/re-exam-portal"
                    className="text-xs bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-100 transition-colors"
                  >
                    Schedule
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                  {s.roll} · {s.subject} · {s.outcome}
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4 border-gray-100" />
          <Link href="/teacher/re-exam-portal" className="text-xs text-blue-600 hover:underline w-full text-center block">
            View all re-exams →
          </Link>
        </div>

      </div>
    </div>
  );
}