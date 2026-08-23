'use client';

import React from 'react';
import { SCHOOL_CONFIG } from '@/constants';
import { Student } from '@/types/academic';
import GradeSheet from '@/components/grade-sheet/components/GradeSheet';
import { StudentResult, Subject, DEFAULT_GRADE_INTERVALS } from '@/components/grade-sheet/types';
import { toBSDate, formatToBSDateString } from '@/lib/bs-calendar';

import { useSchoolInformation } from '@/hooks/use-school-information';

interface TranscriptModalProps {
  showTranscriptModal: Student | null;
  setShowTranscriptModal: (student: Student | null) => void;
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

function toStudentResult(student: Student, schoolInfo?: any): StudentResult {
  const groups: Record<string, { totalObtained: number; totalMax: number }> = {};

  student.scores.forEach((s) => {
    const base = s.subject.replace(/\s*\((TH|Theory)\)\s*$/i, '').trim();
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

  const gpValues = subjects.map((s) => s.gpTheory).filter((v) => v > 0);
  const gpa = gpValues.length > 0 ? gpValues.reduce((a, b) => a + b, 0) / gpValues.length : 0;

  const now = new Date();
  const bsNow = toBSDate(now);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const issueDateAD = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const issueDate = formatToBSDateString(now);

  return {
    schoolName: schoolInfo?.schoolName || SCHOOL_CONFIG.name,
    schoolAddress: schoolInfo?.address || SCHOOL_CONFIG.address,
    schoolPhone: schoolInfo?.phone || SCHOOL_CONFIG.phone,
    schoolEmail: schoolInfo?.emailAlt || schoolInfo?.email || SCHOOL_CONFIG.emailAlt,
    schoolWebsite: schoolInfo?.website || SCHOOL_CONFIG.website,
    logo: schoolInfo?.logoUrl || SCHOOL_CONFIG.logo,
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

export default function TranscriptModal({
  showTranscriptModal,
  setShowTranscriptModal,
}: TranscriptModalProps) {
  const { school } = useSchoolInformation();

  if (!showTranscriptModal) return null;

  const result = toStudentResult(showTranscriptModal, school);
  const schoolName = school?.shortName || school?.schoolName || SCHOOL_CONFIG.nameShort;

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
              fontSize: '13px',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {schoolName} — Grade Sheet
          </span>
          <button
            onClick={() => setShowTranscriptModal(null)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#e8edf2',
          }}
        >
          <div style={{ transform: 'scale(1.1)', transformOrigin: 'top center' }}>
            <GradeSheet result={result} showPrintButton={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
