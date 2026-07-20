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

// function GpaFormula() {
//   return (
//     <span
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: "2px",
//         flexWrap: "wrap",
//       }}
//     >
//       GPA =&nbsp;
//       <span
//         style={{
//           display: "inline-flex",
//           flexDirection: "column",
//           alignItems: "center",
//           fontSize: "8px",
//           lineHeight: 1.3,
//           verticalAlign: "middle",
//         }}
//       >
//         <span
//           style={{
//             borderBottom: "1px solid #1f5e9d",
//             padding: "0 3px 1px",
//           }}
//         >
//           &Sigma;(Credit Hour*Grade Point)
//         </span>
//         <span style={{ padding: "1px 3px 0" }}>
//           Total Credit Hour of the Grade
//         </span>
//       </span>
//     </span>
//   );
// }

const tableHeaderCell: React.CSSProperties = {
  border: "0.5px solid #1f5e9d",
  padding: "4px 6px",
  textAlign: "center",
  fontWeight: 800,
  fontSize: "9.5px",
  color: "#1f5e9d",
  fontFamily: "Arial, sans-serif",
  whiteSpace: "pre-wrap",
};

const tableBodyCell: React.CSSProperties = {
  border: "0.5px solid #1f5e9d",
  padding: "2px 6px",
  textAlign: "center",
  height: "18px",
  color: "#1f5e9d",
  fontSize: "9.5px",
  fontFamily: "Arial, sans-serif",
};

export default function GradeLegend({
  intervals = DEFAULT_GRADE_INTERVALS,
}: GradeLegendProps) {
  const formatInterval = (inv: string) => {
    if (inv.includes('100')) return '90 to 100';
    if (inv.includes('90')) return '80 to below 90';
    if (inv.includes('80')) return '70 to below 80';
    if (inv.includes('70')) return '60 to below 70';
    if (inv.includes('60')) return '50 to below 60';
    if (inv.includes('50')) return '40 to below 50';
    if (inv.includes('40')) return '35 to below 40';
    if (inv.includes('35')) return '0 to below 35';
    return inv;
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "11fr 10fr",
        gap: "4px",
        marginBottom: "6px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* ── LEFT: Notes ── */}
      <div
        style={{
          fontSize: "10px",
          color: "#1f5e9d",
          fontWeight: 700,
          lineHeight: 1.4,
        }}
      >
        <div style={{ marginBottom: "2px", fontSize: "11px" }}>Note:</div>

        <div style={{ marginBottom: "1px" }}>
          1. ABS: Absent
        </div>

        <div style={{ marginBottom: "1px" }}>
          2. *NG: Not Graded
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "1px" }}>
          3.&nbsp;
          <span>
            Achieved Percentage of each subjects =
            <span
              style={{
                display: "inline-flex",
                flexDirection: "column",
                textAlign: "center",
                verticalAlign: "middle",
                margin: "0 4px",
              }}
            >
              <span style={{ borderBottom: "1px solid #000", padding: "0 3px" }}>
                Total Obtained Marks
              </span>
              <span>4 × Total Learning Outcomes</span>
            </span>
            × 100
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          4.&nbsp;
          <span>
            Average GPA =
            <span
              style={{
                display: "inline-flex",
                flexDirection: "column",
                textAlign: "center",
                verticalAlign: "middle",
                margin: "0 4px",
              }}
            >
              <span style={{ borderBottom: "1px solid #000", padding: "0 3px" }}>
                Total GPA Obtained
              </span>
              <span>Total Number of Subjects</span>
            </span>
          </span>
        </div>
      </div>

      {/* ── RIGHT: Grade intervals ── */}
      <div
        style={{
          fontSize: "10px",
          color: "#1f5e9d",
        }}
      >
        <div
          style={{
            color: "#1f5e9d",
            fontWeight: 800,
            fontSize: "11px",
            textAlign: "center",
            marginBottom: "4px",
          }}
        >
          Intervals and Grade
        </div>
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={tableHeaderCell}>SN</th>
              <th style={tableHeaderCell}>{"Interval In\nPercent"}</th>
              <th style={tableHeaderCell}>Grade</th>
              <th style={tableHeaderCell}>{"Grade\nPoint"}</th>
              <th style={tableHeaderCell}>Description</th>
            </tr>
          </thead>
          <tbody>
            {intervals.map((row) => (
              <tr key={row.sn}>
                <td style={tableBodyCell}>{row.sn}</td>
                <td style={tableBodyCell}>{formatInterval(row.interval)}</td>
                <td style={tableBodyCell}>{row.grade}</td>
                <td style={tableBodyCell}>{row.gradePoint}</td>
                <td style={tableBodyCell}>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
