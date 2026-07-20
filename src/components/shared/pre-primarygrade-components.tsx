/**
 * pre-primarygrade-components.tsx
 *
 * UI sub-components for PrePrimaryGradeSheet — styled to match the
 * target grade sheet image exactly.
 */

import React from 'react';
import { formatNum } from '@/lib/format-num';
import type {
  PrePrimaryGradeSheetData,
  PrePrimarySubjectResult,
  GradeScaleRow,
} from './pre-primarygrade';

// ─── Shared Style Constants ──────────────────────────────────────────────────

export const FONT = 'Arial, sans-serif';

export const textColor = '#1A1A18';
export const borderColor = '#999999';
export const lightBorder = '#CCCCCC';
export const mutedBg = '#F5F5F5';
export const whiteBg = '#FFFFFF';
export const headingBg = '#1A1A18';
export const headingText = '#FFFFFF';
export const accentColor = '#003366'; // Dark blue

// ─── SchoolHeader ────────────────────────────────────────────────────────────
// Centered layout: logo on top, school name bold, address, email/website

export function SchoolHeader({ data }: { data: PrePrimaryGradeSheetData }) {
  return (
    <div
      style={{
        textAlign: 'center',
        paddingBottom: '8px',
        borderBottom: 'none',
        marginBottom: '4px',
        fontFamily: FONT,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
        <img
          src="/SVS LOGO NEW.png"
          alt="Sanskar Vidhyapith School Logo"
          width={70}
          height={70}
          style={{ objectFit: 'contain' }}
        />
      </div>

      {/* School Name — largest font */}
      <div
        style={{
          fontSize: '22px',
          fontWeight: 900,
          color: accentColor,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {data.schoolName}
      </div>

      {/* Address */}
      <div
        style={{
          fontSize: '10px',
          color: accentColor,
          fontWeight: 500,
          marginTop: '2px',
        }}
      >
        {data.schoolAddress}
      </div>

      {/* Email / Website */}
      <div
        style={{
          fontSize: '9px',
          color: accentColor,
          fontWeight: 400,
          marginTop: '1px',
        }}
      >
        Email: {data.schoolEmail}
        {data.schoolWebsite ? `  |  Website: ${data.schoolWebsite}` : ''}
      </div>
    </div>
  );
}

// ─── TitleBlock ──────────────────────────────────────────────────────────────
// "FIRST TERM EXAM" (bold, centered) then "GRADE SHEET" (large bold centered)

export function TitleBlock({ evaluationName }: { evaluationName: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '6px 0 4px',
        fontFamily: FONT,
      }}
    >
      {/* evaluationName and GRADE SHEET — same size, slightly smaller than school name */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        {evaluationName || 'FIRST TERM EXAM'}
      </div>
      <div
        style={{
          fontSize: '14px',
          fontWeight: 900,
          color: accentColor,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginTop: '10px',
        }}
      >
        GRADE SHEET
      </div>
    </div>
  );
}

// ─── StudentInfoRow ───────────────────────────────────────────────────────────
// Single line: "THE FOLLOWING ARE THE GRADE BY: ___ DATE OF BIRTH: ___ B.S."
// Second line: "( ___ A.D.) ROLL NO: ___ GRADE: ___ IN THE"

export function StudentInfoRow({ data }: { data: PrePrimaryGradeSheetData }) {
  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    color: textColor,
    fontFamily: FONT,
    whiteSpace: 'nowrap',
  };

  const underlineBase: React.CSSProperties = {
    display: 'inline-block',
    borderBottom: `1px solid ${textColor}`,
    height: '16px',
    verticalAlign: 'bottom',
    fontSize: '10px',
    fontFamily: FONT,
    paddingLeft: '4px',
    paddingRight: '4px',
    color: textColor,
    fontWeight: 600,
    flex: 1,
    minWidth: '60px',
  };

  return (
    <div
      style={{
        width: '100%',
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: FONT,
        color: textColor,
        padding: '8px 0',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {/* Line 1: THE FOLLOWING ARE THE GRADE BY: _name_ DATE OF BIRTH: _dob_ B.S. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          width: '100%',
        }}
      >
        <span style={labelStyle}>THE FOLLOWING ARE THE GRADE BY:</span>
        <span style={{ ...underlineBase, flex: 2, minWidth: '120px', textAlign: 'center' }}>
          {data.studentName || '\u00A0'}
        </span>
        <span style={labelStyle}>DATE OF BIRTH:</span>
        <span style={{ ...underlineBase, flex: 1, minWidth: '60px', textAlign: 'center' }}>
          {data.dateOfBirth || '\u00A0'}
        </span>
        <span style={labelStyle}>B. S.</span>
      </div>

      {/* Line 2: (AD) ROLL NO: _roll_ GRADE: _class_ IN THE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
          width: '100%',
        }}
      >
        <span style={labelStyle}>(</span>
        <span style={{ ...underlineBase, minWidth: '70px', textAlign: 'center' }}>
          {data.dateOfBirthAD || '\u00A0'}
        </span>
        <span style={labelStyle}>&nbsp;A.D.)&nbsp;&nbsp;</span>
        <span style={labelStyle}>ROLL NO:</span>
        <span style={{ ...underlineBase, flex: 0.5, minWidth: '40px', textAlign: 'center' }}>
          {data.rollNo || '\u00A0'}
        </span>
        <span style={labelStyle}>GRADE:</span>
        <span style={{ ...underlineBase, flex: 0.5, minWidth: '50px', textAlign: 'center' }}>
          {data.className || '\u00A0'}
          {data.section ? ` (${data.section})` : ''}
        </span>
        <span style={labelStyle}>IN THE</span>
      </div>
    </div>
  );
}

// ─── DeclarationLine ──────────────────────────────────────────────────────────
// "FIRST TERMINAL EXAMINATION CONDCTED BY SCHOOL ARE GIVEN BELOW."

export function DeclarationLine({ evaluationName }: { evaluationName: string }) {
  return (
    <div
      style={{
        fontSize: '8.5px',
        fontWeight: 700,
        color: textColor,
        fontFamily: FONT,
        marginTop: '6px',
        marginBottom: '10px',
      }}
    >
      <span style={{ fontWeight: 900, marginRight: '4px' }}>
        {evaluationName ? evaluationName.toUpperCase() : 'FIRST TERMINAL EXAMINATION'}
      </span>
      <span>CONDUCTED BY SCHOOL ARE GIVEN BELOW.</span>
    </div>
  );
}

// ─── SubjectGradeTable ───────────────────────────────────────────────────────
// Columns: S.NO., SUBJECTS, GRADE, GRADE POINT, REMARKS
// Numbered rows, plain borders, no alternating bg

export function SubjectGradeTable({ subjects }: { subjects: PrePrimarySubjectResult[] }) {
  const thStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    padding: '3px 4px',
    textAlign: 'center',
    fontSize: '8px',
    fontWeight: 700,
    color: textColor,
    fontFamily: FONT,
    background: whiteBg,
    textTransform: 'uppercase',
  };

  const tdStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    padding: '2px 4px',
    fontSize: '8.5px',
    color: textColor,
    fontFamily: FONT,
    height: '22px',
    verticalAlign: 'middle',
  };

  return (
    <table
      style={{
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontFamily: FONT,
      }}
    >
      <colgroup>
        <col style={{ width: '9%' }} />
        <col style={{ width: '37%' }} />
        <col style={{ width: '14%' }} />
        <col style={{ width: '18%' }} />
        <col style={{ width: '22%' }} />
      </colgroup>
      <thead>
        <tr>
          <th style={{ ...thStyle, textAlign: 'center' }}>S.<br />NO.</th>
          <th style={{ ...thStyle, textAlign: 'left', paddingLeft: '6px' }}>SUBJECTS</th>
          <th style={thStyle}>GRADE</th>
          <th style={thStyle}>GRADE<br />POINT</th>
          <th style={thStyle}>REMARKS</th>
        </tr>
      </thead>
      <tbody>
        {subjects.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              style={{ ...tdStyle, textAlign: 'center', color: '#888', fontStyle: 'italic' }}
            >
              No subjects available.
            </td>
          </tr>
        ) : (
          subjects.map((subject, idx) => (
            <tr key={subject.subjectName}>
              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{idx + 1}.</td>
              <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '6px' }}>
                {subject.subjectName}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>{subject.grade}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                {subject.gradePoint != null ? formatNum(subject.gradePoint, 2) : ''}
              </td>
              <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '4px' }}>
                {subject.remarks || ''}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── GradeScaleTable ─────────────────────────────────────────────────────────
// Header: "Interval & Grades" (centered, single merged cell)
// Columns: MARKS RANGE | GRADE | GRADE POINT | Description

export function GradeScaleTable({ rows }: { rows: GradeScaleRow[] }) {
  const thStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    padding: '3px 4px',
    textAlign: 'center',
    fontSize: '7.5px',
    fontWeight: 700,
    color: textColor,
    fontFamily: FONT,
    background: whiteBg,
  };

  const tdStyle: React.CSSProperties = {
    border: `1px solid ${borderColor}`,
    padding: '2px 4px',
    textAlign: 'center',
    fontSize: '8px',
    color: textColor,
    fontFamily: FONT,
    height: '20px',
    verticalAlign: 'middle',
  };

  return (
    <table
      style={{
        width: '100%',
        tableLayout: 'fixed',
        borderCollapse: 'collapse',
        fontFamily: FONT,
      }}
    >
      <colgroup>
        <col style={{ width: '28%' }} />
        <col style={{ width: '16%' }} />
        <col style={{ width: '20%' }} />
        <col style={{ width: '36%' }} />
      </colgroup>
      <thead>
        {/* Merged header row */}
        <tr>
          <th
            colSpan={4}
            style={{
              border: `1px solid ${borderColor}`,
              padding: '4px',
              textAlign: 'center',
              fontSize: '9px',
              fontWeight: 700,
              fontFamily: FONT,
              color: textColor,
              background: whiteBg,
              letterSpacing: '0.3px',
            }}
          >
            Interval &amp; Grades
          </th>
        </tr>
        <tr>
          <th style={thStyle}>MARKS<br />RANGE</th>
          <th style={thStyle}>GRADE</th>
          <th style={thStyle}>GRADE<br />POINT</th>
          <th style={thStyle}>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.sn}>
            <td style={tdStyle}>{row.interval}</td>
            <td style={{ ...tdStyle, fontWeight: 800 }}>{row.grade}</td>
            <td style={{ ...tdStyle, fontWeight: 700 }}>{row.gradePoint}</td>
            <td style={{ ...tdStyle, textAlign: 'left', paddingLeft: '6px' }}>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── SummarySection ──────────────────────────────────────────────────────────
// Plain text row: "Grade Point Average (GPA) = ___   Rank: ___   Attendance: ___"
// with underlines, no background box

export function SummarySection({
  gpa,
  rank,
}: {
  gpa: number | null;
  rank: number | null;
  attendance?: string;
}) {
  const displayGpa = gpa !== null && gpa !== undefined ? formatNum(gpa, 2) : '';
  const displayRank = rank !== null && rank !== undefined ? String(rank) : '';

  const labelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    color: textColor,
    fontFamily: FONT,
    whiteSpace: 'nowrap',
  };

  const valueUnderline: React.CSSProperties = {
    display: 'inline-block',
    borderBottom: `1px solid ${textColor}`,
    minWidth: '60px',
    height: '14px',
    verticalAlign: 'bottom',
    fontSize: '9px',
    fontFamily: FONT,
    paddingLeft: '4px',
    fontWeight: 700,
    color: textColor,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '130px',
        padding: '6px 2px',
        fontFamily: FONT,
        marginBottom: '4px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', fontSize: '9px' }}>
        <span style={labelStyle} >Grade Point Average (GPA) =</span>
        <span style={valueUnderline}>{displayGpa}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>Rank :</span>
        <span style={{ ...valueUnderline, textAlign: 'center', verticalAlign: 'middle' }}>{displayRank}</span>
      </div>
    </div>
  );
}

// ─── ObservationSection ──────────────────────────────────────────────────────
// "OBSERVATION" bold header, then single-column full-width rows with label + underline value

export function ObservationSection({ data }: { data: PrePrimaryGradeSheetData }) {

  // ── Dynamic path: render rawObservations from the DB directly ────────────
  if (data.rawObservations && data.rawObservations.length > 0) {
    // Build rows: left = categoryTitle, right = itemDescription
    const rows: Array<{ label: string; value: string }> = data.rawObservations.map((r) => ({
      label: r.categoryTitle,
      value: r.itemDescription,
    }));

    return (
      <div style={{ marginBottom: '8px', fontFamily: FONT }}>
        <div
          style={{
            fontSize: '9px',
            fontWeight: 900,
            color: textColor,
            marginBottom: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          OBSERVATION
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: '3px 8px',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: textColor,
                    width: '35%',
                    height: '22px',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.label}
                </td>
                <td
                  style={{
                    border: `1px solid ${borderColor}`,
                    padding: '3px 8px',
                    fontSize: '9px',
                    color: textColor,
                    height: '22px',
                    verticalAlign: 'middle',
                  }}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Static fallback: original hardcoded rows ──────────────────────────────
  const observationRows: Array<{ label: string; value: string }> = [
    { label: 'Attention:', value: data.attention },
    { label: 'Cocurricular Activities:', value: data.coCurricularActivities },
    { label: 'Effort & Interest:', value: data.effortInterest },
    { label: 'Montessori Lab:', value: data.montessoriLab },
    { label: 'Initiative & Self-confidence:', value: data.initiativeConfidence },
    { label: 'Clarification of doubts:', value: data.clarificationOfDoubts },
    { label: 'Neatness in person:', value: data.neatness },
    { label: 'Homework:', value: data.homework },
    { label: 'Remarks:', value: data.remarks },
  ];

  return (
    <div style={{ marginBottom: '8px', fontFamily: FONT }}>
      {/* Section header */}
      <div
        style={{
          fontSize: '9px',
          fontWeight: 900,
          color: textColor,
          marginBottom: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        OBSERVATION
      </div>

      {/* Rows */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: FONT,
        }}
      >
        <tbody>
          {observationRows.map((row) => (
            <tr key={row.label}>
              <td
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: '3px 8px',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: textColor,
                  width: '35%',
                  height: '22px',
                  verticalAlign: 'middle',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.label}
              </td>
              <td
                style={{
                  border: `1px solid ${borderColor}`,
                  padding: '3px 8px',
                  fontSize: '9px',
                  color: textColor,
                  height: '22px',
                  verticalAlign: 'middle',
                }}
              >
                {row.value || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Custom Remark Section ───────────────────────────────────────────────────

export function CustomRemarkSection({ data }: { data: PrePrimaryGradeSheetData }) {
  if (!data.customRemark) return null;

  return (
    <div style={{ marginBottom: '8px', fontFamily: FONT }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 900,
          color: textColor,
          marginBottom: '2px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        CLASS TEACHER'S REMARKS
      </div>
      <div
        style={{
          border: `1px solid ${borderColor}`,
          padding: '8px 10px',
          fontSize: '9px',
          color: textColor,
          lineHeight: 1.5,
          minHeight: '30px',
        }}
      >
        {data.customRemark}
      </div>
    </div>
  );
}

// ─── SignatureBlock ──────────────────────────────────────────────────────────

export function SignatureBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        textAlign: 'center',
        fontFamily: FONT,
        minWidth: '130px',
      }}
    >
      <div style={{ height: '20px' }} />
      <div
        style={{
          borderTop: `1px solid ${borderColor}`,
          paddingTop: '3px',
          fontSize: '9px',
          fontWeight: 700,
          color: textColor,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── FooterSection ───────────────────────────────────────────────────────────
// Class Teacher (left) | Principal (right), then "Date of Issue:" below

export function FooterSection({ data }: { data: PrePrimaryGradeSheetData }) {
  return (
    <div style={{ marginTop: 'auto', paddingTop: '4px', fontFamily: FONT, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Signatures */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: '8px',
        }}
      >
        <SignatureBlock label="Class Teacher" />
        <SignatureBlock label="Principal" />
      </div>

      {/* Date of Issue */}
      <div
        style={{
          fontSize: '9px',
          fontWeight: 700,
          color: textColor,
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
        }}
      >
        <span>DATE OF ISSUE:</span>
        {data.dateOfIssue || data.dateOfIssueAD ? (
          <>
            {data.dateOfIssue && <span>{data.dateOfIssue}</span>}
            {data.dateOfIssue && data.dateOfIssueAD && <span>/</span>}
            {data.dateOfIssueAD && <span>{data.dateOfIssueAD}</span>}
          </>
        ) : (
          <span
            style={{
              display: 'inline-block',
              borderBottom: `1px solid ${textColor}`,
              minWidth: '100px',
              height: '13px',
            }}
          />
        )}
      </div>
    </div>
  );
}
