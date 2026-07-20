'use client';

import React from 'react';
import { SCHOOL_CONFIG } from '@/constants';
import GradeSheet from '@/components/grade-sheet/components/GradeSheet';
import type { StudentResult, Subject } from '@/components/grade-sheet/types';
import { DEFAULT_GRADE_INTERVALS } from '@/components/grade-sheet/types';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SCHOOL_INFO = {
  schoolName: SCHOOL_CONFIG.name,
  schoolAddress: SCHOOL_CONFIG.address,
  schoolPhone: SCHOOL_CONFIG.phone,
  schoolEmail: SCHOOL_CONFIG.emailAlt,
  logo: SCHOOL_CONFIG.logo,
  nepaliYear: '2082',
  englishYear: '2026',
};

function getGradeDescription(grade: string, isNG?: boolean) {
  if (isNG || grade === 'NG') return 'Not Graded';
  const match = DEFAULT_GRADE_INTERVALS.find(g => g.grade === grade);
  return match ? match.description : '\u2013';
}

function mapTermResultToStudentResult(termResult: any): StudentResult {
  const student = termResult.syncedStudent || {};
  const exam = termResult.exam || {};
  const subjectResults = termResult.subjectResults || [];

  const subjects: Subject[] = subjectResults.map((sr: any) => {
    const subjectName = sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject';
    const grade = sr?.grade || 'NG';
    const gp = Number(sr?.gradePoint || 0);
    return {
      name: subjectName,
      creditHourTheory: sr?.creditHoursTheory || sr?.creditHours || 0,
      creditHourInternal: sr?.creditHoursInternal || 0,
      gpTheory: gp,
      gradeTheory: grade,
      gpInternal: 0,
      gradeInternal: '\u2013',
      finalGrade: grade,
      remarks: getGradeDescription(grade, sr?.isNG),
    };
  });

  const gpa = Number(termResult?.gpa || 0);

  return {
    ...SCHOOL_INFO,
    studentName: student?.name || 'Unknown Student',
    rollNo: student?.rollNumber || 'N/A',
    grade: exam?.gradeLevel || student?.class || 'N/A',
    issueDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    issueDateAD: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    gpa,
    rank: 1,
    subjects,
  };
}

function mapAnnualResultToStudentResult(annualResult: any): StudentResult {
  const student = annualResult.syncedStudent || {};
  const subjectResults = annualResult.subjectResults || [];

  const subjects: Subject[] = subjectResults.map((sr: any) => {
    const subjectName = sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject';
    const grade = sr?.grade || 'NG';
    return {
      name: subjectName,
      creditHourTheory: sr?.creditHours || 0,
      creditHourInternal: 0,
      gpTheory: Number(sr?.gradePoint || 0),
      gradeTheory: grade,
      gpInternal: 0,
      gradeInternal: '\u2013',
      finalGrade: grade,
      remarks: getGradeDescription(grade, sr?.isNG),
    };
  });

  const gpa = Number(annualResult?.gpa || 0);

  return {
    ...SCHOOL_INFO,
    studentName: student?.name || 'Unknown Student',
    rollNo: student?.rollNumber || 'N/A',
    grade: student?.class || 'N/A',
    issueDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    issueDateAD: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    gpa,
    rank: annualResult?.classRank || 1,
    subjects,
  };
}

interface SecondaryGradeSheetModalProps {
  result: any;
  type: 'term' | 'annual';
  open: boolean;
  onClose: () => void;
}

export function SecondaryGradeSheetModal({
  result,
  type,
  open,
  onClose,
}: SecondaryGradeSheetModalProps) {
  if (!open || !result) return null;

  const studentResult: StudentResult =
    type === 'term'
      ? mapTermResultToStudentResult(result)
      : mapAnnualResultToStudentResult(result);

  const handlePrint = () => {
    // Find the grade sheet root inside this modal
    const root = document.querySelector<HTMLElement>('.grade-sheet-root');
    if (!root) {
      console.warn('[SecondaryGradeSheetModal] .grade-sheet-root not found');
      return;
    }

    // Collect all styles from the current page
    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Grade Sheet - Print</title>
  ${styleNodes}
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
    .grade-sheet-root {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      box-shadow: none !important;
    }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${root.outerHTML}
</body>
</html>`;

    const printWindow = window.open(
      '',
      '_blank',
      'width=900,height=1200,menubar=no,toolbar=no,location=no,status=no',
    );

    if (!printWindow) {
      alert('Please allow popups for this site to enable printing.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for images and fonts to load before triggering print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };

    // Safety timeout for browsers that don't fire onload on document.write
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '880px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        <div
          className="no-print"
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Sanskar Vidhyapith School — {type === 'term' ? 'Term' : 'Annual'} Grade Sheet
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Grade Sheet
            </Button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            background: '#e8edf2',
          }}
        >
          <GradeSheet result={studentResult} showPrintButton={false} />
        </div>
      </div>
    </div>
  );
}
