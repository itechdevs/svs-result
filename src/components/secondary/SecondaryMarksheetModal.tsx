'use client';

import React, { useState } from 'react';
import { formatNum } from '@/lib/format-num';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shared/ui/dialog';
import {
  SecondaryMarksheetDownload,
  prepareTermMarksheetData,
  prepareAnnualMarksheetData
} from '@/components/secondary/SecondaryMarksheetDownload';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecondaryMarksheetModalProps {
  marksheetId: string | null;
  open: boolean;
  onClose: () => void;
}

export function SecondaryMarksheetModal({ marksheetId, open, onClose }: SecondaryMarksheetModalProps) {
  const { data: marksheet, isLoading, error } = useQuery<any>({
    queryKey: ['secondary-marksheet', marksheetId],
    queryFn: async () => {
      if (!marksheetId) return null;
      return apiClient.get(`/admin/secondary/marksheets/${marksheetId}`);
    },
    enabled: !!marksheetId && open,
  });

  const prepareMarksheetData = () => {
    if (!marksheet) return null;

    // Try to use live relations first, fall back to metadata snapshot
    if (marksheet.termResult && marksheet.termResult.syncedStudent) {
      return prepareTermMarksheetData(
        marksheet.termResult,
        marksheet.termResult.subjectResults || []
      );
    } else if (marksheet.annualResult && marksheet.annualResult.syncedStudent) {
      return prepareAnnualMarksheetData(
        marksheet.annualResult,
        marksheet.annualResult.subjectResults || []
      );
    } else if (marksheet.metadata && typeof marksheet.metadata === 'object') {
      // Fall back to metadata snapshot
      const metadata: any = marksheet.metadata;

      if (marksheet.termResultId) {
        // It's a term marksheet
        return prepareTermMarksheetData(
          {
            ...metadata,
            syncedStudent: metadata.syncedStudent || marksheet.syncedStudent,
            exam: metadata.exam || { name: 'Unknown Exam', gradeLevel: 'Unknown' },
            academicYear: metadata.academicYear || { name: 'Unknown Year' },
            subjectResults: metadata.subjectResults || []
          },
          metadata.subjectResults || []
        );
      } else if (marksheet.annualResultId) {
        // It's an annual marksheet
        return prepareAnnualMarksheetData(
          {
            ...metadata,
            syncedStudent: metadata.syncedStudent || marksheet.syncedStudent,
            academicYear: metadata.academicYear || { name: 'Unknown Year' },
            subjectResults: metadata.subjectResults || []
          },
          metadata.subjectResults || []
        );
      }
    }

    return null;
  };

  const marksheetData = prepareMarksheetData();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Secondary Marksheet
          </DialogTitle>
          <DialogDescription>
            Download the generated marksheet as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading marksheet data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive">Failed to load marksheet</p>
              <p className="text-xs text-muted-foreground">{(error as Error).message}</p>
            </div>
          ) : !marksheetData ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <p className="text-sm text-muted-foreground">No marksheet data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Info Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-sm text-foreground mb-3">Student Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-semibold text-foreground ml-2">{marksheetData.student.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Roll Number:</span>
                    <span className="font-semibold text-foreground ml-2">{marksheetData.student.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grade:</span>
                    <span className="font-semibold text-foreground ml-2">{marksheetData.student.gradeLevel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Section:</span>
                    <span className="font-semibold text-foreground ml-2">{marksheetData.student.section}</span>
                  </div>
                </div>
              </div>

              {/* Result Summary */}
              <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                <h3 className="font-bold text-sm text-foreground mb-3">Result Summary</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Total Subjects</span>
                    <span className="font-bold text-lg text-foreground">{marksheetData.totalSubjects}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Passed</span>
                    <span className="font-bold text-lg text-emerald-600">{marksheetData.passedSubjects}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">NG</span>
                    <span className="font-bold text-lg text-red-600">{marksheetData.ngSubjects}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Grade Point Average:</span>
                    <span className="font-bold text-2xl text-primary">{formatNum(marksheetData.gpa, 2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`font-bold text-sm px-3 py-1 rounded ${marksheetData.resultStatus === 'PROMOTED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      }`}>
                      {marksheetData.resultStatus === 'PROMOTED' ? 'PROMOTED' : 'NG BLOCKED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Marksheet Type */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>
                  {marksheetData.type === 'term' ? 'Term Marksheet' : 'Annual Transcript'}
                  {marksheetData.type === 'term' && (marksheetData as any).exam && (
                    <span className="font-semibold ml-1">({(marksheetData as any).exam.name})</span>
                  )}
                </span>
              </div>

              {/* Download Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <SecondaryMarksheetDownload data={marksheetData} variant="button" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
