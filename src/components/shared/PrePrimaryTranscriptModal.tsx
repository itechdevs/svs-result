'use client';

/**
 * PrePrimaryTranscriptModal
 *
 * Displays the PrePrimaryGradeSheet for a single student inside a modal.
 * Accepts the compiled subject-level results, observation data, and student
 * metadata from the admin ExamResultCompilation view.
 */

import React from 'react';
import PrePrimaryGradeSheet, {
    buildPrePrimaryData,
    StudentObservationEntry,
    PrePrimarySubjectResult,
} from '@/components/shared/pre-primarygrade';

export interface PrePrimaryStudentData {
    studentId: string;
    studentName: string;
    rollNo: string;
    className: string;
    section: string;
    dateOfBirth?: string | null;
    dateOfBirthAD?: string | null;
    subjects: PrePrimarySubjectResult[];
    gpa: number | null;
    rank: number | null;
    attendance: string;
    /** Per-student observation entries fetched from the DB */
    observationResults: StudentObservationEntry[];
    /** Class teacher's custom remark for this student */
    customRemark?: string | null;
    examName: string;
    academicYear: string;
}

interface Props {
    student: PrePrimaryStudentData | null;
    onClose: () => void;
}

export default function PrePrimaryTranscriptModal({ student, onClose }: Props) {
    if (!student) return null;

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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    maxWidth: '900px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '92vh',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header bar */}
                <div
                    className="no-print"
                    style={{
                        padding: '12px 18px',
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
                        Pre-Primary Grade Sheet — {student.studentName}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Arial, sans-serif',
                        }}
                    >
                        Close
                    </button>
                </div>

                {/* Scrollable grade sheet */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '32px',
                        background: '#e8edf2',
                    }}
                >
                    <PrePrimaryGradeSheet data={data} showPrintButton />
                </div>
            </div>
        </div>
    );
}
