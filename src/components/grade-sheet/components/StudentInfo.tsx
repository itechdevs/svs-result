// ─────────────────────────────────────────────
//  StudentInfo — Certificate-style student details
// ─────────────────────────────────────────────

interface StudentInfoProps {
  studentName: string
  rollNo: string
  grade: string
  nepaliYear: string
  englishYear: string
}

/**
 * Renders the official certificate sentence exactly as it appears on
 * Nepal government-style school grade sheets:
 *
 *   THE GRADE(S) SECURED BY: ________ ROLL NO: __ GRADE: __
 *   IN THE FINAL EXAMINATION CONDUCTED IN ____ B.S. ( ____ A.D.) ARE GIVEN BELOW.
 */
export default function StudentInfo({
  studentName,
  rollNo,
  grade,
  nepaliYear,
  englishYear,
}: StudentInfoProps) {
  const underlineStyle: React.CSSProperties = {
    borderBottom: '1px solid #1f5e9d',
    padding: '0 6px',
    fontWeight: 700,
    textAlign: 'center',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        fontSize: '10px',
        color: '#1f5e9d',
        fontWeight: 600,
        fontFamily: 'Arial, sans-serif',
        margin: '8px 0',
        lineHeight: 2.2,
      }}
    >
      {/* Row 1 */}
      <div style={{ lineHeight: 2.2 }}>
        <span>THE FOLLOWING ARE THE GRADES BY: </span>
        <span style={{ ...underlineStyle, fontWeight: 800, minWidth: '120px' }}>
          {studentName}
        </span>
        <span>&nbsp;&nbsp;DATE OF BIRTH: </span>
        <span style={{ ...underlineStyle, minWidth: '70px' }}>2079-01-01</span>
        <span>&nbsp;&nbsp;B.S. ( </span>
        <span style={{ ...underlineStyle, minWidth: '70px' }}>2022-04-14</span>
        <span>&nbsp;A.D.)&nbsp;&nbsp;ROLL NO: </span>
        <span style={{ ...underlineStyle, minWidth: '40px' }}>{rollNo}</span>
        <span>&nbsp;&nbsp;GRADE: </span>
        <span style={{ ...underlineStyle, minWidth: '60px', fontWeight: 800 }}>
          {grade}
        </span>
      </div>

      {/* Row 2 */}
      <div style={{ marginTop: '4px' }}>
        <span>IN THE FINAL EXAMINATION CONDUCTED BY SCHOOL ARE GIVEN BELOW.</span>
      </div>
    </div>
  )
}
