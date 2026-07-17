'use client';

import React from 'react';
import { Student } from '@/types/academic';
import GradeSheet from '@/components/grade-sheet/components/GradeSheet';
import { StudentResult, Subject, DEFAULT_GRADE_INTERVALS } from '@/components/grade-sheet/types';
import { toBSDate, formatToBSDateString } from '@/lib/bs-calendar';

interface BulkGradeSheetsModalProps {
  students: Student[];
  onClose: () => void;
}

function getGradeDetails(pct: number) {
  for (const row of DEFAULT_GRADE_INTERVALS) {
    const parts = row.interval.split(/\s*–\s*/);
    const [low, high] = parts.map(s => {
      const match = s.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    });
    if (pct >= low && pct <= high) {
      return {
        grade: row.grade,
        gp: row.gradePoint === '–' ? 0 : Number(row.gradePoint),
        description: row.description,
      };
    }
  }
  return { grade: 'NG', gp: 0, description: 'Not Graded' };
}

function toStudentResult(student: Student): StudentResult {
  const groups: Record<string, { totalObtained: number; totalMax: number }> = {};

  student.scores.forEach((s) => {
    const base = s.subject.replace(/\s*\((TH|IN|Theory|Internal|External)\)\s*$/i, '').trim();
    if (!groups[base]) groups[base] = { totalObtained: 0, totalMax: 0 };
    groups[base].totalObtained += s.obtained;
    groups[base].totalMax += s.max;
  });

  const subjects: Subject[] = Object.entries(groups).map(([name, data]) => {
    const pct = data.totalMax > 0 ? (data.totalObtained / data.totalMax) * 100 : 0;
    const { grade, gp, description } = getGradeDetails(pct);
    return {
      name,
      gpTheory: gp,
      gradeTheory: grade,
      finalGrade: grade,
      remarks: description,
      marksObtained: data.totalObtained,
      maxMarks: data.totalMax,
    };
  });

  const gpValues = subjects.map((s) => s.gpTheory);
  const gpa = gpValues.length > 0
    ? gpValues.reduce((a, b) => a + b, 0) / gpValues.length
    : 0;

  const now = new Date();
  const bsNow = toBSDate(now);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const issueDateAD = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const issueDate = formatToBSDateString(now);

  return {
    schoolName: 'SANSKAR VIDHYAPITH SCHOOL',
    schoolAddress: 'Balkhu, Kathmandu, Nepal',
    schoolPhone: '9802036680',
    schoolEmail: 'sanskarvschool@gmail.com',
    logo: '/SVS LOGO NEW.png',
    studentName: student.name,
    rollNo: student.rollNo,
    grade: student.class,
    nepaliYear: String(bsNow.bsYear),
    englishYear: String(now.getFullYear()),
    issueDate,
    issueDateAD,
    gpa,
    rank: student.rank ?? 1,
    subjects,
    examName: student.examName,
    dateOfBirth: student.dateOfBirth,
    dateOfBirthAD: student.dateOfBirthAD,
  };
}

export default function BulkGradeSheetsModal({
  students,
  onClose,
}: BulkGradeSheetsModalProps) {
  const studentResults = students.map(toStudentResult);

  const handlePrintAll = () => {
    const sheetElements = document.querySelectorAll('.grade-sheet-root');
    if (!sheetElements.length) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styleSheets = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText).join('');
        } catch {
          return '';
        }
      })
      .join('');

    const baseUrl = document.querySelector('base')?.href || window.location.href;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <base href="${baseUrl}">
        <title>Grade Sheets</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          @media print {
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .grade-sheet-root { page-break-after: always; break-after: page; }
            .grade-sheet-root:last-child { page-break-after: auto !important; break-after: auto !important; }
          }
          body { background: #f0f0f0; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
          ${styleSheets}
        </style>
      </head>
      <body>
        ${Array.from(sheetElements).map((s) => s.outerHTML).join('')}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!students.length) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="no-print p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Bulk Grade Sheets ({students.length} student{students.length !== 1 ? 's' : ''})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              className="px-5 py-2 bg-slate-700 text-white hover:bg-slate-800 rounded font-bold shadow-sm cursor-pointer text-xs"
            >
              Print All
            </button>
            <button
              onClick={onClose}
              className="p-1 px-2.5 hover:bg-red-50 text-slate-500 hover:text-[#ba1a1a] rounded font-bold text-xs transition-colors border border-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable grade sheets */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100">
          {studentResults.map((result, idx) => (
            <div
              key={result.rollNo + idx}
              style={{ marginBottom: idx < studentResults.length - 1 ? 32 : 0 }}
            >
              <GradeSheet result={result} showPrintButton={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
