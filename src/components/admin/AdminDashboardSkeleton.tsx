"use client";

import React from "react";

function SkeletonBlock({ className = "", style = {} }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded ${className}`}
      style={{ minHeight: "1em", ...style }}
    />
  );
}

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between min-h-[120px]">
            <div className="flex justify-between items-start mb-3">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
            </div>
            <div className="flex items-end gap-2 mt-auto">
              <SkeletonBlock className="h-8 w-16" />
              <SkeletonBlock className="h-3 w-8 mb-1" />
            </div>
            <SkeletonBlock className="mt-3 h-1 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Class-wise Performance */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 sm:mb-6">
            <div className="space-y-2">
              <SkeletonBlock className="h-6 w-48" />
              <SkeletonBlock className="h-3 w-64" />
            </div>
            <SkeletonBlock className="h-8 w-32 rounded-lg" />
          </div>

          <div className="flex items-end justify-between gap-4 h-64">
            {[45, 80, 60, 90, 55].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full flex items-end justify-center h-[200px]">
                  <SkeletonBlock className="w-full rounded-t-lg" style={{ height: `${height}%` }} />
                </div>
                <SkeletonBlock className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Pass vs Fail Distribution */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="space-y-2 mb-6">
              <SkeletonBlock className="h-6 w-32" />
              <SkeletonBlock className="h-3 w-40" />
            </div>

            <div className="flex items-center justify-center mb-6">
              <SkeletonBlock className="w-44 h-44 rounded-full" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-3 h-3 rounded-full" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
              <SkeletonBlock className="h-4 w-12" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-3 h-3 rounded-full" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
              <SkeletonBlock className="h-4 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
