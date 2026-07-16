// ─────────────────────────────────────────────
//  SignatureSection — Teacher, Principal, Date of Issue
// ─────────────────────────────────────────────

interface SignatureSectionProps {
  issueDate: string     // Nepali BS date
  issueDateAD: string   // Gregorian AD date
}

function SigBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        width: '140px',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Blank space for actual signature */}
      <div style={{ height: '16px' }} />
      <div
        style={{
          borderTop: '1px solid #1f5e9d',
          paddingTop: '3px',
          fontSize: '9.5px',
          fontWeight: 700,
          color: '#1f5e9d',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
    </div>
  )
}

export default function SignatureSection({ issueDate, issueDateAD }: SignatureSectionProps) {
  return (
    <div style={{ marginTop: 'auto', paddingTop: '2px', fontFamily: 'Arial, sans-serif' }}>
      {/* Signature row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingLeft: '90px',
          paddingRight: '90px',
          marginTop: '6px',
          marginBottom: '20px',
        }}
      >
        <SigBlock label="CLASS TEACHER" />
        <SigBlock label="PRINCIPAL" />
      </div>

      {/* Date of issue */}
      <div
        style={{
          marginTop: '8px',
          fontSize: '10px',
          fontWeight: 700,
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span style={{ color: '#1f5e9d' }}>DATE OF ISSUE:</span>
        <span style={{ color: '#000000', fontWeight: 800 }}>{issueDate}</span>
      </div>
    </div>
  )
}
