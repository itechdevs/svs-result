'use client';

/**
 * PrePrimaryBulkGradeSheetsModal
 *
 * Displays PrePrimaryGradeSheet for every student in a class inside a modal,
 * with a "Print All" button.  Accepts an array of PrePrimaryStudentData which
 * includes per-student observationResults fetched from the DB.
 */

import React from 'react';
import PrePrimaryGradeSheet, {
    buildPrePrimaryData,
} from '@/components/shared/pre-primarygrade';
import type { PrePrimaryStudentData } from '@/components/shared/PrePrimaryTranscriptModal';

interface Props {
    students: PrePrimaryStudentData[];
    onClose: () => void;
}

export default function PrePrimaryBulkGradeSheetsModal({ students, onClose }: Props) {
    if (!students.length) return null;

    const handlePrintAll = () => {
        // Collect all rendered grade sheet root elements
        const sheets = Array.from(
            document.querySelectorAll('.pp-grade-sheet-root'),
        ) as HTMLElement[];
        if (!sheets.length) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const styleSheets = Array.from(document.styleSheets)
            .map((sheet) => {
                try {
                    return Array.from(sheet.cssRules)
                        .map((r) => r.cssText)
                        .join('');
                } catch {
                    return '';
                }
            })
            .join('');

        const baseUrl =
            document.querySelector('base')?.href || window.location.href;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <base href="${baseUrl}">
        <title>Pre-Primary Grade Sheets</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pp-grade-sheet-root { page-break-after: always; break-after: page; }
            .pp-grade-sheet-root:last-child { page-break-after: auto !important; break-after: auto !important; }
            .pp-no-print { display: none !important; }
          }
          body { background: #f0f0f0; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
          ${styleSheets}
        </style>
      </head>
      <body>
        ${sheets.map((s) => s.outerHTML).join('')}
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                style={{ maxHeight: '92vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="no-print p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Pre-Primary Grade Sheets ({students.length} student
                        {students.length !== 1 ? 's' : ''})
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
                    {students.map((student, idx) => {
                        const data = buildPrePrimaryData({
                            syncedStudent: {
                                name: student.studentName,
                                rollNumber: student.rollNo,
                                class: student.className,
                                section: student.section,
                                dateOfBirth: student.dateOfBirth,
                                dateOfBirthAD: student.dateOfBirthAD,
                            },
                            exam: { name: student.examName },
                            academicYear: { name: student.academicYear },
                            subjectResults: student.subjects.map((s) => ({
                                syncedSubjectId: s.subjectName,
                                grade: s.grade,
                                gradePoint: s.gradePoint,
                                remarks: s.remarks,
                                syncedSubject: { name: s.subjectName, code: s.subjectName },
                            })),
                            finalResult: { cgpa: student.gpa, classRank: student.rank },
                            attendance: student.attendance,
                            observationResults: student.observationResults,
                            customRemark: student.customRemark,
                        });

                        return (
                            <div
                                key={student.studentId}
                                style={{
                                    marginBottom:
                                        idx < students.length - 1 ? 32 : 0,
                                }}
                            >
                                <PrePrimaryGradeSheet
                                    data={data}
                                    showPrintButton={false}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
