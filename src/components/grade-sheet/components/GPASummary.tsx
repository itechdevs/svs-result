// ─────────────────────────────────────────────
//  GPASummary — Blue highlighted GPA + Rank strip
// ─────────────────────────────────────────────
import { formatNum } from '@/lib/format-num';

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
              width: '80%',
              borderLeft: '0.5px solid #1f5e9d',
              borderBottom: '0.5px solid #1f5e9d',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#1f5e9d',
              textAlign: 'center',
            }}
          >
            Grade Point Average (GPA) ={' '}
            <strong style={{ fontSize: '12px' }}>{formatNum(gpa, 2)}</strong>
          </td>
          <td
            style={{
              width: '20%',
              borderRight: '0.5px solid #1f5e9d',
              borderBottom: '0.5px solid #1f5e9d',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#1f5e9d',
              textAlign: 'center',
            }}
          >
            Rank: <strong style={{ fontSize: '12px' }}>{rank}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  )
}
