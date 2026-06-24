"use client";

import React from "react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      style={{ minHeight: "1em" }}
    />
  );
}

export default function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-96" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col justify-between min-h-[90px]"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="h-8 w-16" />
              </div>
              <SkeletonBlock className="w-10 h-10 rounded-xl shrink-0" />
            </div>
            <div className="mt-3 sm:mt-4 flex items-center justify-between">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="w-4 h-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Evaluations table */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40">
                  {["Evaluation Title", "Subject & Class", "Actions"].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="px-3 sm:px-5 py-3"
                      >
                        <SkeletonBlock className="h-3 w-24" />
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 sm:px-5 py-3 sm:py-4">
                      <SkeletonBlock className="h-4 w-44 mb-1" />
                      <SkeletonBlock className="h-3 w-56" />
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 hidden sm:table-cell">
                      <SkeletonBlock className="h-6 w-36 rounded-md" />
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                      <SkeletonBlock className="h-7 w-16 rounded-md mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Re-Exam Alerts */}
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
          <div className="p-4 sm:p-5 border-b border-border flex items-center gap-2">
            <SkeletonBlock className="w-5 h-5 rounded" />
            <SkeletonBlock className="h-5 w-36" />
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            <SkeletonBlock className="h-3 w-full mb-1" />
            <SkeletonBlock className="h-3 w-3/4 mb-4" />

            <div className="flex flex-col gap-3 flex-1">
              {[1, 2].map((j) => (
                <div
                  key={j}
                  className="border border-border rounded-xl p-3 bg-muted/20"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <SkeletonBlock className="h-4 w-32" />
                      <SkeletonBlock className="h-3 w-44" />
                    </div>
                    <SkeletonBlock className="h-6 w-16 rounded shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="w-1.5 h-1.5 rounded-full shrink-0" />
                    <SkeletonBlock className="h-3 w-36" />
                  </div>
                </div>
              ))}
            </div>

            <div className="my-4 h-px bg-border" />
            <SkeletonBlock className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
