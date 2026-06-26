// ─────────────────────────────────────────────
//  GradeLegend — Notes (left) + Grade intervals table (right)
// ─────────────────────────────────────────────

import { GradeInterval, DEFAULT_GRADE_INTERVALS } from "../types";

interface GradeLegendProps {
  notes?: string[];
  intervals?: GradeInterval[];
}

const DEFAULT_NOTES = [
  "ABS: Absent",
  "NG: Not Graded",
  "GPA_FORMULA" as const,
  "Students must pass all subjects to be promoted.",
];

/** Fraction-style GPA formula rendered as inline flex */
function GpaFormula() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        flexWrap: "wrap",
      }}
    >
      GPA =&nbsp;
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: "8px",
          lineHeight: 1.3,
          verticalAlign: "middle",
        }}
      >
        <span
          style={{
            borderBottom: "1px solid #1f5e9d",
            padding: "0 3px 1px",
          }}
        >
          &Sigma;(Total Obtained) &times; 100
        </span>
        <span style={{ padding: "1px 3px 0" }}>
          4 &times; No. of Learning Outcomes
        </span>
      </span>
    </span>
  );
}

const tableHeaderCell: React.CSSProperties = {
  border: "0.5px solid #4a7aa8",
  padding: "4px 6px",
  textAlign: "center",
  fontWeight: 700,
  fontSize: "8px",
  textTransform: "uppercase" as const,
  background: "#dbeeff",
  color: "#1f5e9d",
  fontFamily: "Arial, sans-serif",
};

const tableBodyCell: React.CSSProperties = {
  border: "0.5px solid #4a7aa8",
  padding: "3px 6px",
  textAlign: "center",
  fontWeight: 600,
  height: "22px",
  color: "#1f5e9d",
  fontSize: "8.5px",
  fontFamily: "Arial, sans-serif",
};

export default function GradeLegend({
  notes = DEFAULT_NOTES,
  intervals = DEFAULT_GRADE_INTERVALS,
}: GradeLegendProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "5fr 6fr",
        gap: "8px",
        marginBottom: "6px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* ── LEFT: Notes ── */}
      <div
        style={{
          border: "0.5px solid #4a7aa8",
          fontSize: "9px",
          color: "#1f5e9d",
        }}
      >
        <div
          style={{
            background: "#1f5e9d",
            color: "white",
            fontWeight: 700,
            padding: "4px 8px",
            fontSize: "9.5px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Notes
        </div>
        <div style={{ padding: "6px 8px" }}>
          <ol style={{ paddingLeft: "14px", lineHeight: 1.9 }}>
            {notes.map((note, i) => (
              <li
                key={i}
                  style={{
                    marginBottom: "2px",
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                  }}
              >
                {note === "GPA_FORMULA" ? <GpaFormula /> : note}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── RIGHT: Grade intervals ── */}
      <div
        style={{
          border: "0.5px solid #4a7aa8",
          fontSize: "8.5px",
          color: "#1f5e9d",
        }}
      >
        <div
          style={{
            background: "#1f5e9d",
            color: "white",
            fontWeight: 700,
            padding: "4px 8px",
            fontSize: "9.5px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "center",
          }}
        >
          Intervals and Grade
        </div>
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "28%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={tableHeaderCell}>SN</th>
              <th style={tableHeaderCell}>Interval (%)</th>
              <th style={tableHeaderCell}>Grade</th>
              <th style={tableHeaderCell}>Grade Point</th>
              <th style={tableHeaderCell}>Description</th>
            </tr>
          </thead>
          <tbody>
            {intervals.map((row) => (
              <tr key={row.sn}>
                <td style={tableBodyCell}>{row.sn}</td>
                <td style={tableBodyCell}>{row.interval}</td>
                <td style={{ ...tableBodyCell, fontWeight: 800 }}>
                  {row.grade}
                </td>
                <td style={{ ...tableBodyCell, fontWeight: 800 }}>
                  {row.gradePoint}
                </td>
                <td style={tableBodyCell}>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
