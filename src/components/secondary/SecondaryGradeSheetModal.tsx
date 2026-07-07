'use client';

import React from 'react';
import GradeSheet from '@/components/grade-sheet/components/GradeSheet';
import type { StudentResult, Subject } from '@/components/grade-sheet/types';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SCHOOL_INFO = {
  schoolName: 'SANSKAR VIDHYAPITH SCHOOL',
  schoolAddress: 'Balkhu, Kathmandu, Nepal',
  schoolPhone: '9802036680',
  schoolEmail: 'sanskarvschool@gmail.com',
  logo: '/SVS LOGO NEW.png',
  nepaliYear: '2082',
  englishYear: '2026',
};

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
      remarks: sr?.isNG ? 'Not Graded' : '\u2013',
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
      remarks: sr?.isNG ? 'Not Graded' : '\u2013',
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
    document.body.classList.add('printing-grade-sheet');
    window.print();
    window.addEventListener(
      'afterprint',
      () => document.body.classList.remove('printing-grade-sheet'),
      { once: true },
    );
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
