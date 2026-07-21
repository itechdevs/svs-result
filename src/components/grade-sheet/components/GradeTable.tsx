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
        {subjects.map((subject, idx) => {
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
            <tr key={subject.name} style={{ background: evenBg }}>
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
