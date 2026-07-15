// ─────────────────────────────────────────────
//  GradeTable — Main subject marks table
//  Theory + Internal rows with merged Final Grade / Remarks cells
// ─────────────────────────────────────────────

import { Fragment } from "react";
import { Subject } from "../types";

interface GradeTableProps {
  subjects: Subject[];
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
  fontSize: "9.5px",
  textTransform: "uppercase",
};

const internalSubjectCell: React.CSSProperties = {
  ...subjectCell,
  paddingLeft: "16px",
  fontStyle: "italic",
  fontWeight: 600,
  fontSize: "9px",
};

const mergedCell: React.CSSProperties = {
  ...centerCell,
  background: "#f0f6ff",
  fontWeight: 800,
  fontSize: "10.5px",
  verticalAlign: "middle",
};

const headerCell: React.CSSProperties = {
  border: "0.5px solid #4a7aa8",
  padding: "6px 10px",
  height: "34px",
  verticalAlign: "middle",
  textAlign: "center",
  fontSize: "9.5px",
  fontWeight: 700,
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
        fontSize: "10px",
        marginBottom: "0",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <colgroup>
        <col style={{ width: "6%" }} />
        <col style={{ width: "32%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "20%" }} />
      </colgroup>
      <thead>
        <tr style={{ background: "#ffffff" }}>
          <th style={headerCell}>S.N.</th>
          <th
            style={{
              ...headerCell,
              textAlign: "left",
              paddingLeft: "10px",
            }}
          >
            SUBJECTS
          </th>
          <th style={headerCell}>CREDIT HOUR (CH)</th>
          <th style={headerCell}>GRADE</th>
          <th style={headerCell}>GRADE POINT</th>
          <th style={headerCell}>REMARKS</th>
        </tr>
      </thead>

      <tbody>
        {subjects.map((subject, idx) => {
          const evenBg = idx % 2 === 0 ? "#ffffff" : "#f8fbff";
          return (
            <tr key={subject.name} style={{ background: evenBg }}>
              <td style={centerCell}>{idx + 1}.</td>
              <td style={subjectCell}>{subject.name}</td>
              <td style={centerCell}>{subject.creditHourTheory.toFixed(1)}</td>
              <td style={centerCell}>{subject.finalGrade}</td>
              <td style={centerCell}>
                {subject.gpTheory > 0 ? subject.gpTheory.toFixed(2) : "\u2013"}
              </td>
              <td style={{ ...subjectCell, textAlign: "left", fontWeight: 600 }}>
                {subject.remarks}.
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
