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

export default function ReExamPortalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <SkeletonBlock className="h-8 w-72" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-center gap-4"
          >
            <SkeletonBlock className="w-12 h-12 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-7 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="px-5 py-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
          <SkeletonBlock className="h-4 w-24" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {["SN", "Student", "Class", "Task / Outcome", "Marks", "Re-Exam", "Status", "Action"].map(
                  (h, i) => (
                    <th key={i} className="px-4 py-3">
                      <SkeletonBlock className="h-3 w-16" />
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-6 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-32 mb-1" />
                    <SkeletonBlock className="h-3 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-6 w-16 rounded-md" />
                  </td>
                  <td className="px-4 py-4">
                    <SkeletonBlock className="h-4 w-28 mb-1" />
                    <SkeletonBlock className="h-3 w-36" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <SkeletonBlock className="h-4 w-16 mx-auto mb-1" />
                    <SkeletonBlock className="h-3 w-10 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <SkeletonBlock className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <SkeletonBlock className="h-6 w-14 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <SkeletonBlock className="h-8 w-16 rounded-lg mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3 border-t border-border flex flex-wrap items-center justify-between gap-2 bg-muted/20">
          <SkeletonBlock className="h-3 w-40" />
          <div className="flex items-center gap-1">
            <SkeletonBlock className="h-7 w-7 rounded-md" />
            <SkeletonBlock className="h-7 w-7 rounded-md" />
            <SkeletonBlock className="h-7 w-7 rounded-md" />
            <SkeletonBlock className="h-7 w-7 rounded-md" />
            <SkeletonBlock className="h-7 w-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
