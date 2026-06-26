// ─────────────────────────────────────────────
//  BackgroundPattern — Repeating diagonal school name
// ─────────────────────────────────────────────

interface BackgroundPatternProps {
  schoolName: string
}

export default function BackgroundPattern({ schoolName }: BackgroundPatternProps) {
  const repeated = `${schoolName}    `.repeat(20)
  const rows = Array.from({ length: 30 })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-200px',
          transform: 'rotate(-25deg)',
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          overflow: 'hidden',
        }}
      >
        {rows.map((_, i) => (
          <div
            key={i}
            style={{
              whiteSpace: 'nowrap',
              opacity: 0.045,
              fontSize: '10px',
              fontFamily: 'Arial, sans-serif',
              color: '#1f5e9d',
              letterSpacing: '2px',
              fontWeight: 600,
              userSelect: 'none',
            }}
          >
            {repeated}
          </div>
        ))}
      </div>
    </div>
  )
}
