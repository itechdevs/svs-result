'use client';

import React, { useCallback } from 'react';
import {
    FONT,
    accentColor,
    headingText,
    whiteBg,
    borderColor,
    SchoolHeader,
    TitleBlock,
    StudentInfoRow,
    DeclarationLine,
    SubjectGradeTable,
    GradeScaleTable,
    SummarySection,
    ObservationSection,
    FooterSection,
} from './pre-primarygrade-components';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PrePrimarySubjectResult {
    subjectName: string;
    grade: string;
    gradePoint: number | null;
    remarks: string | null;
}

export interface GradeScaleRow {
    sn: number;
    interval: string;
    grade: string;
    gradePoint: string;
    description: string;
}

export interface PrePrimaryGradeSheetData {
    schoolLogo?: string;
    schoolName: string;
    schoolAddress: string;
    schoolEmail: string;
    schoolWebsite: string;
    academicYear: string;
    evaluationName: string;
    studentName: string;
    dateOfBirth: string;
    rollNo: string;
    admissionNo: string;
    className: string;
    section: string;
    subjects: PrePrimarySubjectResult[];
    gradeScale: GradeScaleRow[];
    gpa: number | null;
    rank: number | null;
    attendance: string;
    observation: string;
    attention: string;
    coCurricularActivities: string;
    effortInterest: string;
    montessoriLab: string;
    initiativeConfidence: string;
    clarificationOfDoubts: string;
    neatness: string;
    homework: string;
    remarks: string;
    classTeacher: string;
    principal: string;
    dateOfIssue: string;
    dateOfIssueAD: string;
    /**
     * Raw observation entries from the DB, grouped by category.
     * When present these are rendered directly in ObservationSection
     * instead of the fixed attention/homework/… fields.
     */
    rawObservations?: StudentObservationEntry[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const DEFAULT_GRADE_SCALE: GradeScaleRow[] = [
    { sn: 1, interval: '90 \u2013 100', grade: 'A+', gradePoint: '4.0', description: 'Outstanding' },
    { sn: 2, interval: '80 \u2013 89', grade: 'A', gradePoint: '3.6', description: 'Excellent' },
    { sn: 3, interval: '70 \u2013 79', grade: 'B+', gradePoint: '3.2', description: 'Very Good' },
    { sn: 4, interval: '60 \u2013 69', grade: 'B', gradePoint: '2.8', description: 'Good' },
    { sn: 5, interval: '50 \u2013 59', grade: 'C+', gradePoint: '2.4', description: 'Satisfactory' },
    { sn: 6, interval: '40 \u2013 49', grade: 'C', gradePoint: '2.0', description: 'Acceptable' },
    { sn: 7, interval: '35 \u2013 39', grade: 'D', gradePoint: '1.6', description: 'Basic' },
    { sn: 8, interval: '0 \u2013 34', grade: 'NG', gradePoint: '\u2013', description: 'Not Graded' },
];

export const EMPTY_DATA: PrePrimaryGradeSheetData = {
    schoolName: '',
    schoolAddress: '',
    schoolEmail: '',
    schoolWebsite: '',
    academicYear: '',
    evaluationName: '',
    studentName: '',
    dateOfBirth: '',
    rollNo: '',
    admissionNo: '',
    className: '',
    section: '',
    subjects: [],
    gradeScale: DEFAULT_GRADE_SCALE,
    gpa: null,
    rank: null,
    attendance: '',
    observation: '',
    attention: '',
    coCurricularActivities: '',
    effortInterest: '',
    montessoriLab: '',
    initiativeConfidence: '',
    clarificationOfDoubts: '',
    neatness: '',
    homework: '',
    remarks: '',
    classTeacher: '',
    principal: '',
    dateOfIssue: '',
    dateOfIssueAD: '',
};

// ─── Observation Result type ─────────────────────────────────────────────────

export interface StudentObservationEntry {
    categoryTitle: string;
    itemDescription: string;
    selectedOption: string;
    remarks: string | null;
}

// ─── Data Transformer ────────────────────────────────────────────────────────

export function buildPrePrimaryData(params: {
    syncedStudent?: {
        name: string;
        rollNumber: string;
        class: string;
        section: string;
    };
    academicYear?: { name: string };
    exam?: { name: string };
    evaluationTemplates?: Array<{
        id: string;
        name: string;
        syncedSubjectId: string;
        syncedSubject?: { name: string; code: string };
    }>;
    evaluationResults?: Array<{
        evaluationTemplateId: string;
        marksObtained?: number | null;
        effectiveMarks?: number | null;
        remarks?: string | null;
        evaluationTemplate?: {
            name: string;
            syncedSubjectId?: string;
            syncedSubject?: { name: string; code: string };
        };
    }>;
    subjectResults?: Array<{
        syncedSubjectId: string;
        grade?: string | null;
        gradePoint?: number | null;
        percentage?: number | null;
        remarks?: string | null;
        syncedSubject?: { name: string; code: string };
    }>;
    finalResult?: {
        cgpa?: number | null;
        classRank?: number | null;
    };
    gradeScales?: Array<{
        minPercent: number;
        maxPercent: number;
        grade: string;
        gradePoint?: number | null;
        description?: string | null;
    }>;
    attendance?: string;
    /** Observation results for this specific student from the DB */
    observationResults?: StudentObservationEntry[];
}): PrePrimaryGradeSheetData {
    const {
        syncedStudent,
        academicYear,
        exam,
        evaluationTemplates = [],
        evaluationResults = [],
        subjectResults = [],
        finalResult,
        gradeScales = [],
        attendance = '',
        observationResults = [],
    } = params;

    // ── Pass observation results straight through — no keyword mapping ────────
    // ObservationSection renders rawObservations directly when present,
    // so we don't need to match descriptions to fixed grade-sheet fields.

    let subjects: PrePrimarySubjectResult[] = [];

    if (subjectResults.length > 0) {
        subjects = subjectResults.map((sr) => ({
            subjectName: sr.syncedSubject?.name || sr.syncedSubjectId,
            grade: sr.grade || '\u2013',
            gradePoint: sr.gradePoint ?? null,
            remarks: sr.remarks || null,
        }));
    } else if (evaluationTemplates.length > 0) {
        const templateMap = new Map(evaluationTemplates.map((t) => [t.id, t]));
        const subjectAgg: Record<
            string,
            { name: string; totalMarks: number; totalMax: number; remarks: string[] }
        > = {};

        for (const er of evaluationResults) {
            const tmpl = er.evaluationTemplate || templateMap.get(er.evaluationTemplateId);
            const subjId = tmpl?.syncedSubjectId || er.evaluationTemplateId;
            const subjName = tmpl?.syncedSubject?.name || tmpl?.name || subjId;
            if (!subjectAgg[subjId]) {
                subjectAgg[subjId] = { name: subjName, totalMarks: 0, totalMax: 0, remarks: [] };
            }
            const marks = er.effectiveMarks ?? er.marksObtained ?? 0;
            subjectAgg[subjId].totalMarks += Number(marks);
            if (er.remarks) subjectAgg[subjId].remarks.push(er.remarks);
        }

        subjects = Object.entries(subjectAgg).map(([, agg]) => {
            const pct = agg.totalMax > 0 ? (agg.totalMarks / agg.totalMax) * 100 : 0;
            const gd = getGradeFromScale(pct, gradeScales);
            return {
                subjectName: agg.name,
                grade: gd.grade,
                gradePoint: gd.gradePoint,
                remarks: agg.remarks.join('; ') || null,
            };
        });
    }

    const gradeScale: GradeScaleRow[] =
        gradeScales.length > 0
            ? gradeScales
                .map((gs, idx) => ({
                    sn: idx + 1,
                    interval: `${Number(gs.minPercent)} \u2013 ${Number(gs.maxPercent)}`,
                    grade: gs.grade,
                    gradePoint: gs.gradePoint != null ? gs.gradePoint.toFixed(1) : '\u2013',
                    description: gs.description || '',
                }))
                .sort((a, b) => a.sn - b.sn)
            : DEFAULT_GRADE_SCALE;

    return {
        schoolName: 'SANSKAR VIDHYAPITH SCHOOL',
        schoolAddress: 'Balkhu, Kumari Club, Kathmandu – 14, Nepal',
        schoolEmail: 'sanskarvidhyapith@gmail.com',
        schoolWebsite: 'www.svs.edu.np',
        academicYear: academicYear?.name || '',
        evaluationName: exam?.name || 'FIRST TERM EXAM',
        studentName: syncedStudent?.name || '',
        dateOfBirth: '',
        rollNo: syncedStudent?.rollNumber || '',
        admissionNo: '',
        className: syncedStudent?.class || '',
        section: syncedStudent?.section || '',
        subjects,
        gradeScale,
        gpa: finalResult?.cgpa ?? null,
        rank: finalResult?.classRank ?? null,
        attendance,
        observation: '',
        attention: '',
        coCurricularActivities: '',
        effortInterest: '',
        montessoriLab: '',
        initiativeConfidence: '',
        clarificationOfDoubts: '',
        neatness: '',
        homework: '',
        remarks: '',
        classTeacher: '',
        principal: '',
        dateOfIssue: '',
        dateOfIssueAD: '',
        rawObservations: observationResults.length > 0 ? observationResults : undefined,
    };
}

function getGradeFromScale(
    percentage: number,
    scales: Array<{
        minPercent: number;
        maxPercent: number;
        grade: string;
        gradePoint?: number | null;
    }>,
): { grade: string; gradePoint: number | null } {
    for (const s of scales) {
        if (percentage >= Number(s.minPercent) && percentage <= Number(s.maxPercent)) {
            return { grade: s.grade, gradePoint: s.gradePoint ?? null };
        }
    }
    if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0 };
    if (percentage >= 80) return { grade: 'A', gradePoint: 3.6 };
    if (percentage >= 70) return { grade: 'B+', gradePoint: 3.2 };
    if (percentage >= 60) return { grade: 'B', gradePoint: 2.8 };
    if (percentage >= 50) return { grade: 'C+', gradePoint: 2.4 };
    if (percentage >= 40) return { grade: 'C', gradePoint: 2.0 };
    if (percentage >= 35) return { grade: 'D', gradePoint: 1.6 };
    return { grade: 'NG', gradePoint: null };
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PrePrimaryGradeSheetProps {
    data?: PrePrimaryGradeSheetData;
    showPrintButton?: boolean;
}

export default function PrePrimaryGradeSheet({
    data = EMPTY_DATA,
    showPrintButton = true,
}: PrePrimaryGradeSheetProps) {
    const handlePrint = useCallback(() => {
        document.body.classList.add('printing-grade-sheet');
        window.print();
        window.addEventListener(
            'afterprint',
            () => document.body.classList.remove('printing-grade-sheet'),
            { once: true },
        );
    }, []);

    return (
        <>
            <style>{`
        @media print {
          body > *:not(.pp-grade-sheet-root) { display: none !important; }
          .pp-no-print { display: none !important; }
          .pp-grade-sheet-root {
            box-shadow: none !important;
            margin: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 8mm; }
        }
      `}</style>

            {showPrintButton && (
                <div className="pp-no-print" style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <button
                        onClick={handlePrint}
                        style={{
                            padding: '8px 28px',
                            background: accentColor,
                            color: headingText,
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: FONT,
                            letterSpacing: '0.5px',
                        }}
                    >
                        Print Grade Sheet
                    </button>
                </div>
            )}

            <div
                className="pp-grade-sheet-root"
                style={{
                    width: '210mm',
                    minHeight: '297mm',
                    background: whiteBg,
                    position: 'relative',
                    margin: '0 auto',
                    overflow: 'hidden',
                    fontFamily: FONT,
                    padding: '10mm 12mm',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `2px solid ${borderColor}`,
                }}
            >
                {/* Watermark logo — centered, low opacity */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 0,
                        pointerEvents: 'none',
                    }}
                >
                    <img
                        src="/SVS LOGO NEW.png"
                        alt=""
                        aria-hidden="true"
                        style={{
                            width: '260px',
                            height: '260px',
                            objectFit: 'contain',
                            opacity: 0.07,
                        }}
                    />
                </div>

                {/* All content sits above the watermark */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <SchoolHeader data={data} />
                    <TitleBlock evaluationName={data.evaluationName} />
                    <StudentInfoRow data={data} />
                    <DeclarationLine evaluationName={data.evaluationName} />

                    {/* Subject table + Grade scale side-by-side */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 1fr',
                            gap: '8px',
                            marginBottom: '6px',
                        }}
                    >
                        <div>
                            <SubjectGradeTable subjects={data.subjects} />
                        </div>
                        <div>
                            <GradeScaleTable rows={data.gradeScale} />
                        </div>
                    </div>

                    <SummarySection gpa={data.gpa} rank={data.rank} attendance={data.attendance} />
                    <ObservationSection data={data} />
                    <FooterSection data={data} />
                </div>
            </div>
        </>
    );
}
