// ─────────────────────────────────────────────
//  Watermark — Large semi-transparent centered logo
// ─────────────────────────────────────────────

interface WatermarkProps {
  /** Path or URL to the school logo */
  logo: string
  schoolName: string
}

/**
 * Falls back to an SVG emblem if the logo image fails to load.
 * The SVG emblem mirrors the school crest style used across Nepal govt documents.
 */
export default function Watermark({ logo, schoolName }: WatermarkProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.1,
        width: '500px',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Primary: actual logo image */}
      <img
        src={logo}
        alt=""
        width={500}
        height={500}
        style={{ objectFit: 'contain', position: 'absolute', inset: 0 }}
        onError={(e) => {
          // Hide broken image; fallback SVG is underneath
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />

      {/* Fallback SVG emblem */}
      <svg
        viewBox="0 0 200 200"
        width="420"
        height="420"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke="#1f5e9d" strokeWidth="4" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#1f5e9d" strokeWidth="1.5" />
        {/* Star / torch emblem */}
        <polygon
          points="100,22 111,55 147,55 119,75 130,108 100,88 70,108 81,75 53,55 89,55"
          fill="none"
          stroke="#1f5e9d"
          strokeWidth="2.5"
        />
        <text x="100" y="140" textAnchor="middle" fontSize="11" fontFamily="Arial" fontWeight="900" fill="#1f5e9d" letterSpacing="1">
          {schoolName.split(' ')[0]}
        </text>
        <text x="100" y="154" textAnchor="middle" fontSize="9" fontFamily="Arial" fontWeight="700" fill="#1f5e9d" letterSpacing="0.5">
          {schoolName.split(' ').slice(1).join(' ')}
        </text>
        <text x="100" y="172" textAnchor="middle" fontSize="8" fontFamily="Arial" fill="#1f5e9d" letterSpacing="4">
          ✦ ✦ ✦
        </text>
      </svg>
    </div>
  )
}
