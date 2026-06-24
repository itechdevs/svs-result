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

export default function TeacherEvaluationsSkeleton() {
  const statLabels = ["Published Cards", "Drafted", "Total"];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title + buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-64" />
          <SkeletonBlock className="h-4 w-44" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-36 rounded-lg" />
          <SkeletonBlock className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-card p-3 sm:p-5 rounded-2xl border border-border shadow-sm">
        {statLabels.map((_, i) => (
          <div key={i} className={i > 0 ? "border-l border-border pl-2 sm:pl-6" : ""}>
            <SkeletonBlock className="h-3 w-24 mb-2" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
        ))}
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-xl overflow-hidden flex flex-col"
          >
            <div className="p-5 flex-1 space-y-4">
              {/* Card header: status badge + subject pill */}
              <div className="flex justify-between items-start">
                <SkeletonBlock className="h-5 w-20 rounded-md" />
                <SkeletonBlock className="h-5 w-28 rounded-full" />
              </div>

              {/* Title */}
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-3/4" />

              {/* Unit badge */}
              <SkeletonBlock className="h-6 w-32 rounded-lg" />

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-5 w-12" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-5 w-12" />
                </div>
              </div>

              {/* Outcomes preview */}
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <SkeletonBlock className="h-2 w-2 rounded-full shrink-0" />
                    <SkeletonBlock className="h-3 flex-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer button */}
            <div className="px-5 pb-5 pt-2 border-t border-border/50">
              <SkeletonBlock className="h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
