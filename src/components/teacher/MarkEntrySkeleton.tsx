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

export default function MarkEntrySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0 space-y-1.5">
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Empty evaluation plan state */}
      <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
        <SkeletonBlock className="h-4 w-96 mx-auto" />
      </div>

      {/* Main table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
          <div className="min-w-0 space-y-1.5">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-3 w-52" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-9 w-28 rounded-lg" />
            <SkeletonBlock className="h-9 w-20 rounded-lg" />
            <SkeletonBlock className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-12" />
                </th>
                <th className="px-4 py-3">
                  <SkeletonBlock className="h-3 w-20" />
                </th>
                {[1, 2, 3].map((i) => (
                  <th key={i} className="px-2 py-3 text-center">
                    <SkeletonBlock className="h-3 w-16 mx-auto" />
                  </th>
                ))}
                <th className="px-4 py-3 text-center">
                  <SkeletonBlock className="h-3 w-20 mx-auto" />
                </th>
                <th className="px-4 py-3 text-center">
                  <SkeletonBlock className="h-3 w-16 mx-auto" />
                </th>
                <th className="px-4 py-3 text-center">
                  <SkeletonBlock className="h-3 w-12 mx-auto" />
                </th>
                <th className="px-4 py-3 text-center">
                  <SkeletonBlock className="h-3 w-12 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <SkeletonBlock className="h-4 w-10" />
                  </td>
                  <td className="px-4 py-3">
                    <SkeletonBlock className="h-4 w-36" />
                  </td>
                  {[1, 2, 3].map((i) => (
                    <td key={i} className="px-2 py-2 text-center">
                      <SkeletonBlock className="h-9 w-16 rounded border-2 mx-auto" />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <SkeletonBlock className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SkeletonBlock className="h-6 w-16 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SkeletonBlock className="h-6 w-14 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SkeletonBlock className="h-8 w-16 rounded-lg mx-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
          <SkeletonBlock className="h-3 w-40" />
          <div className="flex items-center gap-1">
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
