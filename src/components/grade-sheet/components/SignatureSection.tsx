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
      <div style={{ height: '32px' }} />
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
    <div style={{ marginTop: 'auto', paddingTop: '8px', fontFamily: 'Arial, sans-serif' }}>
      {/* Signature row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <SigBlock label="CLASS TEACHER" />
        {/* Center spacer — intentionally empty */}
        <div />
        <SigBlock label="PRINCIPAL" />
      </div>

      {/* Date of issue */}
      <div
        style={{
          marginTop: '8px',
          paddingTop: '5px',
          borderTop: '1px dashed #aac4dd',
          fontSize: '9.5px',
          fontWeight: 700,
          color: '#1f5e9d',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        <span>DATE OF ISSUE:</span>
        <span>{issueDate} B.S.</span>
        <span style={{ color: '#4a7aa8' }}>/</span>
        <span>{issueDateAD} A.D.</span>
      </div>
    </div>
  )
}
