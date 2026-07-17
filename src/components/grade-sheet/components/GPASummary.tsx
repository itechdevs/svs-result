// ─────────────────────────────────────────────
//  GPASummary — Blue highlighted GPA + Rank strip
// ─────────────────────────────────────────────

interface GPASummaryProps {
  gpa: number
  rank: number
}

export default function GPASummary({ gpa, rank }: GPASummaryProps) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <tbody>
        <tr>
          <td
            style={{
              borderLeft: '0.5px solid #4a7aa8',
              borderRight: '0.5px solid #4a7aa8',
              borderBottom: '0.5px solid #4a7aa8',
              padding: '5px 14px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#1f5e9d',
              textAlign: 'center',
            }}
          >
            Grade Point Average (GPA) ={' '}
            <strong style={{ fontSize: '12px' }}>{gpa.toFixed(2)}</strong>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Rank = <strong style={{ fontSize: '12px' }}>{rank}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
