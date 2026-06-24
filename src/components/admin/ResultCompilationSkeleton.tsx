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

export default function ResultCompilationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-32 rounded-lg" />
          <SkeletonBlock className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-muted/20">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-4 py-3"><SkeletonBlock className="h-3 w-16" /></th>
                <th className="px-4 py-3"><SkeletonBlock className="h-3 w-32" /></th>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-4 py-3 text-center"><SkeletonBlock className="h-3 w-16 mx-auto" /></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <SkeletonBlock className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <SkeletonBlock className="h-4 w-32" />
                        <SkeletonBlock className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <td key={i} className="px-4 py-3 text-center">
                      <SkeletonBlock className="h-5 w-14 rounded mx-auto" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
