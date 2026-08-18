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
  schoolWebsite: SCHOOL_CONFIG.website,
  logo: SCHOOL_CONFIG.logo,
  nepaliYear: '2082',
  englishYear: '2026',
};

import { getSecondaryGrade } from '@/lib/secondary-grades';

function getGradeDescription(grade: string, isNG?: boolean) {
  if (isNG || grade === 'NG') return 'Not Graded';
  const match = DEFAULT_GRADE_INTERVALS.find(g => g.grade === grade);
  return match ? match.description : '\u2013';
}

function mapTermResultToStudentResult(termResult: any): StudentResult {
  const student = termResult.syncedStudent || {};
  // exam can be a direct relation on the result object
  const exam = termResult.exam || {};
  const subjectResults = termResult.subjectResults || [];

  const subjects: Subject[] = subjectResults.map((sr: any) => {
    const subjectName = sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject';
    const finalGrade = sr?.grade || 'NG';
    const components = sr?.subjectConfig?.components || [];
    const thComp = components.find((c: any) => c.type === 'THEORY');
    const prComp = components.find((c: any) => c.type === 'PRACTICAL');

    const thObtained = sr?.theoryMarks != null ? Number(sr.theoryMarks) : null;
    const prObtained = sr?.practicalMarks != null ? Number(sr.practicalMarks) : null;
    const thFull = thComp ? Number(thComp.fullMarks) : null;
    const prFull = prComp ? Number(prComp.fullMarks) : null;
    const thCH = thComp ? Number(thComp.creditHour) : (sr?.creditHours || 0);
    const prCH = prComp ? Number(prComp.creditHour) : 0;

    let thGradeStr = '—', thGPNum = 0, prGradeStr = '—', prGPNum = 0;

    if (thObtained !== null && thFull) {
      const scale = getSecondaryGrade((thObtained / thFull) * 100);
      thGradeStr = scale.grade;
      thGPNum = scale.gradePoint;
    }
    if (prObtained !== null && prFull) {
      const scale = getSecondaryGrade((prObtained / prFull) * 100);
      prGradeStr = scale.grade;
      prGPNum = scale.gradePoint;
    }

    // If either component is NG, the overall final grade must be NG
    const effectiveFinalGrade =
      thGradeStr === 'NG' || prGradeStr === 'NG' ? 'NG' : finalGrade;

    return {
      name: subjectName,
      creditHourTheory: thCH,
      creditHourInternal: prCH,
      gpTheory: thGPNum || Number(sr?.gradePoint || 0), // fallback to total GP if no components
      gradeTheory: thGradeStr !== '—' ? thGradeStr : finalGrade,
      gpInternal: prGPNum,
      gradeInternal: prGradeStr,
      finalGrade: effectiveFinalGrade,
      remarks: getGradeDescription(effectiveFinalGrade, effectiveFinalGrade === 'NG'),
    };
  });

  const gpa = Number(termResult?.gpa || 0);

  return {
    ...SCHOOL_INFO,
    studentName: student?.name || 'Unknown Student',
    rollNo: student?.rollNumber || 'N/A',
    grade: exam?.gradeLevel || student?.class || 'N/A',
    examName: exam?.name || '',
    issueDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    issueDateAD: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    gpa,
    rank: termResult?.classRank || 1,
    subjects,
  };
}

function mapAnnualResultToStudentResult(annualResult: any): StudentResult {
  const student = annualResult.syncedStudent || {};
  const subjectResults = annualResult.subjectResults || [];

  const subjects: Subject[] = subjectResults.map((sr: any) => {
    const subjectName = sr?.subjectConfig?.syncedSubject?.name || 'Unknown Subject';
    const finalGrade = sr?.grade || 'NG';

    // Attempt to extract components and marks (may not exist in old annual logic, but good for future-proofing)
    const components = sr?.subjectConfig?.components || [];
    const thComp = components.find((c: any) => c.type === 'THEORY');
    const prComp = components.find((c: any) => c.type === 'PRACTICAL');

    const thObtained = sr?.theoryMarks != null ? Number(sr.theoryMarks) : null;
    const prObtained = sr?.practicalMarks != null ? Number(sr.practicalMarks) : null;
    const thFull = thComp ? Number(thComp.fullMarks) : null;
    const prFull = prComp ? Number(prComp.fullMarks) : null;
    const thCH = thComp ? Number(thComp.creditHour) : (sr?.creditHours || 0);
    const prCH = prComp ? Number(prComp.creditHour) : 0;

    let thGradeStr = '—', thGPNum = 0, prGradeStr = '—', prGPNum = 0;

    if (thObtained !== null && thFull) {
      const scale = getSecondaryGrade((thObtained / thFull) * 100);
      thGradeStr = scale.grade;
      thGPNum = scale.gradePoint;
    }
    if (prObtained !== null && prFull) {
      const scale = getSecondaryGrade((prObtained / prFull) * 100);
      prGradeStr = scale.grade;
      prGPNum = scale.gradePoint;
    }

    // If either component is NG, the overall final grade must be NG
    const effectiveFinalGrade =
      thGradeStr === 'NG' || prGradeStr === 'NG' ? 'NG' : finalGrade;

    return {
      name: subjectName,
      creditHourTheory: thCH,
      creditHourInternal: prCH,
      gpTheory: thGPNum || Number(sr?.gradePoint || 0),
      gradeTheory: thGradeStr !== '—' ? thGradeStr : finalGrade,
      gpInternal: prGPNum,
      gradeInternal: prGradeStr,
      finalGrade: effectiveFinalGrade,
      remarks: getGradeDescription(effectiveFinalGrade, effectiveFinalGrade === 'NG'),
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
  // Don't render if not open or no result
  if (!open || !result) return null;

  // Guard: if subjectResults is missing or empty, show a message instead of crashing
  const hasData = (result.subjectResults && result.subjectResults.length > 0) || result.syncedStudent;
  if (!hasData) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Arial, sans-serif', color: '#64748b', marginBottom: '16px' }}>
            No grade data available for this student yet. Ensure the result has been compiled.
          </p>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', background: '#1f5e9d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
