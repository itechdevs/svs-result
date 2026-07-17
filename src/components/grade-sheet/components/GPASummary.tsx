// ─────────────────────────────────────────────
//  GPASummary — Blue highlighted GPA + Rank strip
// ─────────────────────────────────────────────

interface GPASummaryProps {
  gpa: number
  rank: number
}

export default function GPASummary({ gpa, rank }: GPASummaryProps) {
  const cellStyle: React.CSSProperties = {
    borderLeft: "0.5px solid #4a7aa8",
    borderRight: "0.5px solid #4a7aa8",
    borderBottom: "0.5px solid #4a7aa8",
    padding: "5px 14px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#1f5e9d",
    textAlign: "center",
  };

  return (
    <table
      style={{
        width: "100%",
        tableLayout: "fixed",
        borderCollapse: "collapse",
        marginBottom: "10px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <colgroup>
        <col style={{ width: "34%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "32%" }} />
      </colgroup>
      <tbody>
        <tr>
          <td colSpan={3} style={cellStyle}>
            Grade Point Average (GPA) ={" "}
            <strong style={{ fontSize: "12px" }}>{gpa.toFixed(2)}</strong>
          </td>
          <td style={cellStyle}>
            Rank = <strong style={{ fontSize: "12px" }}>{rank}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
