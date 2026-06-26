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
  color: "#ffffff",
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
        marginBottom: "4px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <colgroup>
        <col style={{ width: "32%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "19%" }} />
        <col style={{ width: "18%" }} />
      </colgroup>
      <thead>
        <tr style={{ background: "#1f5e9d" }}>
          <th
            style={{
              ...headerCell,
              textAlign: "left",
              paddingLeft: "10px",
            }}
          >
            SUBJECT
          </th>
          <th style={headerCell}>
            CREDIT
            <br />
            HOUR
          </th>
          <th style={headerCell}>
            GRADE
            <br />
            POINT (GP)
          </th>
          <th style={headerCell}>GRADE</th>
          <th style={headerCell}>FINAL GRADE</th>
          <th style={headerCell}>REMARKS</th>
        </tr>
      </thead>

      <tbody>
        {subjects.map((subject, idx) => {
          const evenBg = idx % 2 === 0 ? "#ffffff" : "#f8fbff";
          return (
            <Fragment key={subject.name}>
              {/* Theory row */}
              <tr style={{ background: evenBg }}>
                <td style={subjectCell}>{subject.name} (TH)</td>
                <td style={centerCell}>{subject.creditHourTheory}</td>
                <td style={centerCell}>{subject.gpTheory.toFixed(1)}</td>
                <td style={centerCell}>{subject.gradeTheory}</td>
                <td style={mergedCell} rowSpan={2}>
                  {subject.finalGrade}
                </td>
                <td
                  style={{ ...mergedCell, fontWeight: 600, fontSize: "9.5px" }}
                  rowSpan={2}
                >
                  {subject.remarks}
                </td>
              </tr>

              {/* Internal row */}
              <tr key={`${subject.name}-in`} style={{ background: evenBg }}>
                <td style={internalSubjectCell}>{subject.name} (IN)</td>
                <td style={centerCell}>{subject.creditHourInternal}</td>
                <td style={centerCell}>{subject.gpInternal.toFixed(1)}</td>
                <td style={centerCell}>{subject.gradeInternal}</td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
