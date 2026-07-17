// ─────────────────────────────────────────────
//  StudentInfo — Certificate-style student details
// ─────────────────────────────────────────────

interface StudentInfoProps {
  studentName: string;
  rollNo: string;
  grade: string;
  nepaliYear: string;
  englishYear: string;
  dateOfBirth?: string;
  dateOfBirthAD?: string;
}

export default function StudentInfo({
  studentName,
  rollNo,
  grade,
  nepaliYear,
  englishYear,
  dateOfBirth,
  dateOfBirthAD,
}: StudentInfoProps) {
  const labelStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
    fontWeight: 600,
    fontSize: '10px',
  };

  const underlineBase: React.CSSProperties = {
    borderBottom: '1px solid #1f5e9d',
    padding: '0 4px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    fontSize: '10px',
    textAlign: 'center',
  };

  return (
    <div
      style={{
        width: '100%',
        color: '#1f5e9d',
        fontFamily: 'Arial, sans-serif',
        margin: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        lineHeight: 1.6,
      }}
    >
      {/* Line 1: Name + DOB BS */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%' }}>
        <span style={labelStyle}>THE FOLLOWING ARE THE GRADE BY:</span>
        <span style={{ ...underlineBase, fontWeight: 800, flex: 2, minWidth: '120px' }}>
          {studentName}
        </span>
        <span style={labelStyle}>DATE OF BIRTH:</span>
        <span style={{ ...underlineBase, flex: 1, minWidth: '60px' }}>
          {dateOfBirth || '\u00A0'}
        </span>
        <span style={labelStyle}>B. S.</span>
      </div>

      {/* Line 2: DOB AD + Roll + Grade */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%' }}>
        <span style={labelStyle}>(</span>
        <span style={{ ...underlineBase, minWidth: '70px' }}>
          {dateOfBirthAD || '\u00A0'}
        </span>
        <span style={labelStyle}>A.D.)</span>

        <span style={labelStyle}>ROLL NO:</span>
        <span style={{ ...underlineBase, flex: 0.5, minWidth: '40px' }}>
          {rollNo}
        </span>
        <span style={labelStyle}>GRADE:</span>
        <span style={{ ...underlineBase, fontWeight: 800, flex: 0.5, minWidth: '50px' }}>
          {grade}
        </span>
        <span style={labelStyle}>IN THE</span>
      </div>

      {/* Line 3: Exam Year */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%' }}>
        <span style={labelStyle}>EXAMINATION CONDUCTED IN</span>
        <span style={{ ...underlineBase, minWidth: '45px' }}>
          {nepaliYear}
        </span>
        <span style={labelStyle}>B.S. ARE GIVEN BELOW.</span>
      </div>
    </div>
  );
}
