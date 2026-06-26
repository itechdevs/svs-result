// ─────────────────────────────────────────────
//  GPASummary — Blue highlighted GPA + Rank strip
// ─────────────────────────────────────────────

interface GPASummaryProps {
  gpa: number
  rank: number
}

export default function GPASummary({ gpa, rank }: GPASummaryProps) {
  return (
    <div
      style={{
        background: '#dbeeff',
        border: '1px solid #4a7aa8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 14px',
        fontSize: '10.5px',
        fontWeight: 700,
        color: '#1f5e9d',
        marginBottom: '6px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <span>
        Grade Point Average (GPA) ={' '}
        <strong style={{ fontSize: '11px' }}>{gpa.toFixed(2)}</strong>
      </span>
      <span style={{ color: '#4a7aa8', fontSize: '13px', fontWeight: 300 }}>|</span>
      <span>
        Rank = <strong style={{ fontSize: '11px' }}>{rank}</strong>
      </span>
    </div>
  )
}
