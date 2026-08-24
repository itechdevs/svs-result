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
import { Loader2, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SecondaryMarksheetModalProps {
  marksheetId: string | null;
  open: boolean;
  onClose: () => void;
}

/** Renders one table row for a subject component (TH or PR/IN) */
function SubjectRow({
  code,
  label,
  ch,
  gp,
  grade,
  finalGrade,
  isNG,
  alt,
}: {
  code?: string;
  label: string;
  ch: number;
  gp?: number;
  grade?: string;
  finalGrade?: string;
  isNG?: boolean;
  alt?: boolean;
}) {
  return (
    <tr className={alt ? 'bg-muted/30' : 'bg-background'}>
      <td className="border border-border px-2 py-1 text-center text-xs text-muted-foreground">{code || '—'}</td>
      <td className="border border-border px-2 py-1 text-xs font-medium">{label}</td>
      <td className="border border-border px-2 py-1 text-center text-xs">{formatNum(ch, 2)}</td>
      <td className="border border-border px-2 py-1 text-center text-xs font-semibold text-primary">
        {gp != null && gp > 0 ? formatNum(gp, 2) : '—'}
      </td>
      <td className="border border-border px-2 py-1 text-center text-xs font-bold text-blue-700 dark:text-blue-400">
        {grade || '—'}
      </td>
      <td className="border border-border px-2 py-1 text-center text-xs font-bold text-primary">
        {finalGrade || ''}
      </td>
      <td className={`border border-border px-2 py-1 text-center text-xs font-semibold ${isNG ? 'text-red-600' : 'text-emerald-600'}`}>
        {finalGrade ? (isNG ? 'NG' : '') : ''}
      </td>
    </tr>
  );
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

    // Prefer metadata if it exists because we enrich it (e.g. with componentDetails) in the POST route
    if (marksheet.metadata && typeof marksheet.metadata === 'object') {
      const metadata: any = marksheet.metadata;

      if (marksheet.termResultId) {
        return prepareTermMarksheetData(
          {
            ...metadata,
            syncedStudent: metadata.syncedStudent || marksheet.syncedStudent || marksheet.termResult?.syncedStudent,
            exam: metadata.exam || marksheet.termResult?.exam || { name: 'Unknown Exam', gradeLevel: 'Unknown' },
            academicYear: metadata.academicYear || marksheet.termResult?.academicYear || { name: 'Unknown Year' },
            subjectResults: metadata.subjectResults || marksheet.termResult?.subjectResults || []
          },
          metadata.subjectResults || marksheet.termResult?.subjectResults || []
        );
      } else if (marksheet.annualResultId) {
        return prepareAnnualMarksheetData(
          {
            ...metadata,
            syncedStudent: metadata.syncedStudent || marksheet.syncedStudent || marksheet.annualResult?.syncedStudent,
            academicYear: metadata.academicYear || marksheet.annualResult?.academicYear || { name: 'Unknown Year' },
            subjectResults: metadata.subjectResults || marksheet.annualResult?.subjectResults || []
          },
          metadata.subjectResults || marksheet.annualResult?.subjectResults || []
        );
      }
    }

    // Fallback to relational data
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
    }

    return null;
  };

  const marksheetData = prepareMarksheetData();

  // Build table rows from subject results
  const buildTableRows = () => {
    if (!marksheetData) return [];
    return [...marksheetData.subjectResults].sort((a, b) =>
      a.subject.localeCompare(b.subject)
    );
  };

  const tableRows = buildTableRows();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Secondary Marksheet
          </DialogTitle>
          <DialogDescription>
            Student result with individual Theory & Practical grade breakdown
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
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
            <div className="space-y-5">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/40 rounded-lg p-4">
                <div>
                  <span className="text-muted-foreground text-xs">Name</span>
                  <p className="font-bold text-foreground">{marksheetData.student.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Roll No.</span>
                  <p className="font-bold text-foreground">{marksheetData.student.rollNumber}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Grade</span>
                  <p className="font-semibold text-foreground">{marksheetData.student.gradeLevel}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Section</span>
                  <p className="font-semibold text-foreground">{marksheetData.student.section}</p>
                </div>
                {marksheetData.type === 'term' && (marksheetData as any).exam && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Exam</span>
                    <p className="font-semibold text-foreground">{(marksheetData as any).exam.name}</p>
                  </div>
                )}
              </div>

              {/* Subject Marks Table — NEB format */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[12%]">Subject Code</th>
                      <th className="border border-primary/50 px-2 py-2 text-left font-bold text-xs w-[36%]">Subjects</th>
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[10%]">Credit Hour</th>
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[12%]">Grade Point</th>
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[10%]">Grade</th>
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[12%]">Final Grade</th>
                      <th className="border border-primary/50 px-2 py-2 text-center font-bold text-xs w-[8%]">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((subject, idx) => {
                      const hasTh = subject.thCreditHours > 0;
                      const hasPr = subject.prCreditHours > 0;
                      const alt = idx % 2 === 0;

                      return (
                        <React.Fragment key={idx}>
                          {hasTh && (
                            <SubjectRow
                              code={subject.subjectCode}
                              label={`${subject.subject.toUpperCase()} (TH)`}
                              ch={subject.thCreditHours}
                              gp={subject.thGP}
                              grade={subject.thGrade}
                              finalGrade={subject.grade}
                              isNG={subject.isNG}
                              alt={alt}
                            />
                          )}
                          {hasPr && (
                            <SubjectRow
                              code={subject.subjectCode}
                              label={`${subject.subject.toUpperCase()} (PR)`}
                              ch={subject.prCreditHours}
                              gp={subject.prGP}
                              grade={subject.prGrade}
                              finalGrade={hasTh ? undefined : subject.grade}
                              isNG={!hasTh ? subject.isNG : undefined}
                              alt={alt}
                            />
                          )}
                          {!hasTh && !hasPr && (
                            <SubjectRow
                              code={subject.subjectCode}
                              label={subject.subject.toUpperCase()}
                              ch={subject.totalCreditHours}
                              gp={subject.gradePoint}
                              grade={subject.grade}
                              finalGrade={subject.grade}
                              isNG={subject.isNG}
                              alt={alt}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-bold">
                      <td colSpan={2} className="border border-border px-2 py-2 text-right text-xs font-bold">Total</td>
                      <td className="border border-border px-2 py-2 text-center text-xs font-bold text-primary">
                        {formatNum(marksheetData.totalCreditHours, 2)}
                      </td>
                      <td colSpan={4} className="border border-border px-2 py-2 text-right text-xs font-bold pr-4">
                        Grade Point Average (GPA):{' '}
                        <span className="text-primary text-sm">{formatNum(marksheetData.gpa, 2)}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Result Status */}
              <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  {marksheetData.resultStatus === 'PROMOTED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-bold text-sm ${marksheetData.resultStatus === 'PROMOTED' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {marksheetData.resultStatus === 'PROMOTED' ? 'PROMOTED' : 'NG BLOCKED'}
                  </span>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Subjects: {marksheetData.totalSubjects} | Passed: {marksheetData.passedSubjects} | NG: {marksheetData.ngSubjects}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <SecondaryMarksheetDownload data={marksheetData} variant="button" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

