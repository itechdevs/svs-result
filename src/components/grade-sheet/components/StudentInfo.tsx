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
    whiteSpace: "nowrap",
    fontWeight: 600,
  };

  const underlineStyle: React.CSSProperties = {
    borderBottom: "1px solid #1f5e9d",
    padding: "0 4px",
    fontWeight: 700,
    textAlign: "center",
    whiteSpace: "nowrap",
    minWidth: "30px",
  };

  return (
    <div
      style={{
        width: "100%",
        fontSize: "10px",
        color: "#1f5e9d",
        fontWeight: 600,
        fontFamily: "Arial, sans-serif",
        margin: "6px 0",
        padding: "8px 0",
        lineHeight: "1.6",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          width: "100%",
          marginBottom: "6px",
        }}
      >
        <span style={labelStyle}>THE FOLLOWING ARE THE GRADE BY:</span>
        <span
          style={{
            ...underlineStyle,
            fontWeight: 800,
            flex: 2,
            minWidth: "80px",
          }}
        >
          {studentName}
        </span>
        <span style={labelStyle}>DATE OF BIRTH:</span>
        <span style={{ ...underlineStyle, flex: 1, minWidth: "60px" }}>
          {dateOfBirth || '\u00A0'}
        </span>
        <span style={labelStyle}>B. S.</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          width: "100%",
          marginBottom: "6px",
        }}
      >
        <span style={labelStyle}>(</span>
        <span style={{ ...underlineStyle, flex: 1, minWidth: "60px" }}>
          {dateOfBirthAD || '\u00A0'}
        </span>
        <span style={labelStyle}>A.D.)</span>
        <span style={labelStyle}>ROLL NO:</span>
        <span style={{ ...underlineStyle, minWidth: "30px" }}>{rollNo}</span>
        <span style={labelStyle}>GRADE:</span>
        <span
          style={{
            ...underlineStyle,
            fontWeight: 800,
            flex: 1,
            minWidth: "50px",
          }}
        >
          {grade}
        </span>
        <span style={labelStyle}>IN THE</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          width: "100%",
        }}
      >
        <span style={labelStyle}>EXAMINATION CONDUCTED IN</span>
        <span style={{ ...underlineStyle, minWidth: "38px" }}>
          {nepaliYear}
        </span>
        <span style={labelStyle}>B.S. ARE GIVEN BELOW.</span>
      </div>
    </div>
  );
}
