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
  examName?: string;
}

export default function StudentInfo({
  studentName,
  rollNo,
  grade,
  nepaliYear,
  englishYear,
  dateOfBirth,
  dateOfBirthAD,
  examName,
}: StudentInfoProps) {
  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1f5e9d",
    fontFamily: "Arial, sans-serif",
    whiteSpace: "nowrap",
    marginRight: "4px",
  };

  const underlineBase: React.CSSProperties = {
    display: "inline-block",
    borderBottom: "1px solid #1f5e9d",
    padding: "0px 2px 2px 2px",
    fontSize: "13px",
    fontFamily: "Arial, sans-serif",
    color: "#1f5e9d",
    fontWeight: 600,
    flex: 1,
    minWidth: "30px",
    lineHeight: 1.5,
    textAlign: "center",
  };

  return (
    <div
      style={{
        width: "100%",
        fontSize: "13px",
        fontWeight: 700,
        fontFamily: '"Arial", sans-serif',
        color: "#1f5e9d",
        padding: "4px 0",
        lineHeight: "1.6",
        display: "flex",
        flexDirection: "column",
        marginBottom: "8px",
        gap: "2px",
      }}
    >
      {/* Line 1: Name + DOB BS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
        }}
      >
        <span style={labelStyle}>THE FOLLOWING ARE THE GRADE BY:</span>
        <span
          style={{
            ...underlineBase,
            minWidth: "200px",
            maxWidth: "200px",
          }}
        >
          {studentName}
        </span>
        <span style={labelStyle}>DATE OF BIRTH:</span>
        <span style={{ ...underlineBase, minWidth: "60px" }}>
          {dateOfBirth || "\u00A0"}
        </span>
        <span style={labelStyle}>B. S.</span>
      </div>

      {/* Line 2: DOB AD + Roll + Grade */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          width: "100%",
        }}
      >
        <span style={labelStyle}>(</span>
        <span style={{ ...underlineBase, minWidth: "40px" }}>
          {dateOfBirthAD || "\u00A0"}
        </span>
        <span style={labelStyle}>&nbsp;A.D.)&nbsp;&nbsp;</span>
        <span style={labelStyle}>ROLL NO:</span>
        <span style={{ ...underlineBase, minWidth: "40px" }}>{rollNo}</span>
        <span style={labelStyle}>GRADE:</span>
        <span style={{ ...underlineBase, minWidth: "40px" }}>{grade}</span>
        <span style={labelStyle}>IN THE</span>
      </div>

      {/* Line 3: Exam Year */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          width: "100%",
          marginTop: "4px",
        }}
      >
        <span style={{ ...labelStyle, fontWeight: 900, marginRight: "4px" }}>
          {examName ? examName.toUpperCase() : "EXAMINATION"}
        </span>
        <span style={labelStyle}>CONDUCTED IN</span>
        <span style={{ ...underlineBase, minWidth: "100px", maxWidth: "150px" }}>{nepaliYear}</span>
        <span style={labelStyle}>B.S. ARE GIVEN BELOW.</span>
      </div>
    </div>
  );
}
