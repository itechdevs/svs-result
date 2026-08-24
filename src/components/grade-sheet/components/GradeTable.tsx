// ─────────────────────────────────────────────
//  GradeTable — Subject marks table
//  Shows: SUBJECT | GP | GRADE | REMARKS
//  All grade values are calculated dynamically from the grading intervals.
// ─────────────────────────────────────────────

import React from 'react';
import { formatNum } from '@/lib/format-num';
import { Subject, DEFAULT_GRADE_INTERVALS } from "../types";

interface GradeTableProps {
  subjects: Subject[];
}

function getGradeDetails(pct: number) {
  for (const row of DEFAULT_GRADE_INTERVALS) {
    const parts = row.interval.split(/\s*–\s*/);
    const [low, high] = parts.map((s) => {
      const match = s.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    });
    if (pct >= low && pct <= high) {
      return {
        grade: row.grade,
        gp: row.gradePoint === "–" ? 0 : Number(row.gradePoint),
        description: row.description,
      };
    }
  }
  return { grade: "NG", gp: 0, description: "Not Graded" };
}

const cell: React.CSSProperties = {
  border: "0.5px solid #4a7aa8",
  padding: "0 10px",
  height: "30px",
  verticalAlign: "middle",
  color: "#1f5e9d",
  fontWeight: 600,
  fontFamily: "Arial, sans-serif",
};

const centerCell: React.CSSProperties = {
  ...cell,
  textAlign: "center",
  fontWeight: 700,
};

const subjectCell: React.CSSProperties = {
  ...cell,
  textAlign: "left",
  paddingLeft: "8px",
  fontWeight: 700,
  fontSize: "11.5px",
  textTransform: "uppercase",
};

const remarksCell: React.CSSProperties = {
  ...cell,
  textAlign: "center",
  fontWeight: 800,
};

const headerCell: React.CSSProperties = {
  border: "0.5px solid #4a7aa8",
  padding: "6px 10px",
  height: "34px",
  verticalAlign: "middle",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "#1f5e9d",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.3,
};

export default function GradeTable({ subjects }: GradeTableProps) {
  const sorted = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

  // Auto-detect component mode: any subject has practical credit hours or GP
  const hasComponents = sorted.some(
    (s) => (s.creditHourInternal ?? 0) > 0 || (s.gpInternal ?? 0) > 0
  );

  if (hasComponents) {
    const totalCH = sorted.reduce(
      (sum, s) => sum + (s.creditHourTheory ?? 0) + (s.creditHourInternal ?? 0),
      0
    );

    return (
      <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
          fontSize: "11px",
          marginBottom: "0",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <colgroup>
          <col style={{ width: "27%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "21%" }} />
        </colgroup>
        <thead>
          <tr style={{ background: "#ffffff" }}>
            <th style={{ ...headerCell, textAlign: "left", paddingLeft: "8px" }}>SUBJECTS</th>
            <th style={headerCell}>CREDIT<br />HOUR</th>
            <th style={headerCell}>GRADE<br />POINT</th>
            <th style={headerCell}>GRADE</th>
            <th style={headerCell}>FINAL<br />GRADE</th>
            <th style={headerCell}>REMARKS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((subject, idx) => {
            const evenBg = idx % 2 === 0 ? "#ffffff" : "#f8fbff";
            const thCH = subject.creditHourTheory ?? 0;
            const prCH = subject.creditHourInternal ?? 0;
            const hasTh = thCH > 0;
            const hasPr = prCH > 0;
            const thGP = subject.gpTheory ?? 0;
            const prGP = subject.gpInternal ?? 0;
            const thGrade = subject.gradeTheory || "—";
            const prGrade = subject.gradeInternal || "—";
            const finalGrade = subject.finalGrade;
            const remarks = subject.remarks;

            return (
              <React.Fragment key={`subj-${idx}`}>
                {hasTh && (
                  <tr style={{ background: evenBg }}>
                    <td style={{ ...subjectCell, fontSize: "10px" }}>{subject.name.toUpperCase()} (TH)</td>
                    <td style={centerCell}>{thCH}</td>
                    <td style={centerCell}>{thGP != null && thGP > 0 ? formatNum(thGP, 2) : '—'}</td>
                    <td style={centerCell}>{thGrade}</td>
                    {/* FINAL GRADE — spans TH+PR rows, full border, centered */}
                    <td
                      rowSpan={hasPr ? 2 : 1}
                      style={{
                        border: "0.5px solid #4a7aa8",
                        padding: "0 8px",
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontWeight: 900,
                        fontSize: "12px",
                        color: finalGrade === 'NG' ? "#c0392b" : "#1f5e9d",
                        fontFamily: "Arial, sans-serif",
                        background: evenBg,
                      }}
                    >
                      {finalGrade}
                    </td>
                    {/* REMARKS — spans TH+PR rows, full border, centered */}
                    <td
                      rowSpan={hasPr ? 2 : 1}
                      style={{
                        border: "0.5px solid #4a7aa8",
                        padding: "0 8px",
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontWeight: 800,
                        fontSize: "10.5px",
                        color: "#1f5e9d",
                        fontFamily: "Arial, sans-serif",
                        background: evenBg,
                      }}
                    >
                      {remarks}
                    </td>
                  </tr>
                )}
                {hasPr && (
                  <tr style={{ background: evenBg }}>
                    <td style={{ ...subjectCell, fontSize: "10px" }}>{subject.name.toUpperCase()} (PR)</td>
                    <td style={centerCell}>{prCH}</td>
                    <td style={centerCell}>{prGP != null && prGP > 0 ? formatNum(prGP, 2) : '—'}</td>
                    <td style={centerCell}>{prGrade}</td>
                    {/* FINAL GRADE and REMARKS are spanned from TH row — do NOT render here */}
                    {!hasTh && (
                      <>
                        <td style={{ border: "0.5px solid #4a7aa8", padding: "0 8px", textAlign: "center", verticalAlign: "middle", fontWeight: 900, fontSize: "12px", color: finalGrade === 'NG' ? "#c0392b" : "#1f5e9d", fontFamily: "Arial, sans-serif", background: evenBg }}>{finalGrade}</td>
                        <td style={{ border: "0.5px solid #4a7aa8", padding: "0 8px", textAlign: "center", verticalAlign: "middle", fontWeight: 800, fontSize: "10.5px", color: "#1f5e9d", fontFamily: "Arial, sans-serif", background: evenBg }}>{remarks}</td>
                      </>
                    )}
                  </tr>
                )}
                {!hasTh && !hasPr && (
                  <tr style={{ background: evenBg }}>
                    <td style={{ ...subjectCell, fontSize: "10.5px" }}>{subject.name.toUpperCase()}</td>
                    <td style={centerCell}>{(subject.creditHourTheory ?? 0) + (subject.creditHourInternal ?? 0)}</td>
                    <td style={centerCell}>{thGP != null && thGP > 0 ? formatNum(thGP, 2) : '—'}</td>
                    <td style={centerCell}>{thGrade}</td>
                    <td style={{ ...centerCell, fontWeight: 900, fontSize: "12px", color: finalGrade === 'NG' ? "#c0392b" : "#1f5e9d" }}>{finalGrade}</td>
                    <td style={{ ...remarksCell, fontSize: "10.5px" }}>{remarks}</td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {/* Total Credit Hours footer */}
          <tr style={{ background: "#eef4ff" }}>
            <td style={{ ...subjectCell, fontWeight: 900, fontSize: "11px", color: "#1f5e9d" }}>TOTAL</td>
            <td style={{ ...centerCell, fontWeight: 900, fontSize: "12px", color: "#1f5e9d" }}>{totalCH}</td>
            <td colSpan={4} style={{ ...cell, textAlign: "center", color: "#94a3b8", fontSize: "10px", fontStyle: "italic" }}>

            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // ── Standard Mode: single row per subject, no CH column ──────────────────
  return (
    <table
      style={{
        width: "100%",
        tableLayout: "fixed",
        borderCollapse: "collapse",
        fontSize: "12px",
        marginBottom: "0",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <colgroup>
        <col style={{ width: "34%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "32%" }} />
      </colgroup>
      <thead>
        <tr style={{ background: "#ffffff" }}>
          <th
            style={{
              ...headerCell,
              textAlign: "left",
              paddingLeft: "10px",
            }}
          >
            SUBJECTS
          </th>
          <th style={headerCell}>
            GRADE
            <br />
            POINT (GP)
          </th>
          <th style={headerCell}>GRADE</th>
          <th style={headerCell}>REMARKS</th>
        </tr>
      </thead>

      <tbody>
        {sorted.map((subject, idx) => {
          const evenBg = idx % 2 === 0 ? "#ffffff" : "#f8fbff";

          let grade = subject.finalGrade;
          let gp = subject.gpTheory;
          let remarks = subject.remarks;

          if (
            subject.marksObtained !== undefined &&
            subject.maxMarks &&
            subject.maxMarks > 0
          ) {
            const pct = (subject.marksObtained / subject.maxMarks) * 100;
            const details = getGradeDetails(pct);
            grade = details.grade;
            gp = details.gp;
            remarks = details.description;
          }

          return (
            <tr key={`subj-${idx}`} style={{ background: evenBg }}>
              <td style={subjectCell}>{subject.name}</td>
              <td style={centerCell}>{formatNum(gp, 2)}</td>
              <td style={centerCell}>{grade}</td>
              <td style={remarksCell}>{remarks}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
