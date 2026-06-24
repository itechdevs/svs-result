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

export default function ExamResultCompilationSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-72" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-lg" />
          <SkeletonBlock className="h-9 w-32 rounded-lg" />
          <SkeletonBlock className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]">
        <SkeletonBlock className="w-16 h-16 rounded-full mb-4 mx-auto" />
        <SkeletonBlock className="h-6 w-48 mb-2 mx-auto" />
        <SkeletonBlock className="h-4 w-64 mx-auto" />
      </div>
    </div>
  );
}
