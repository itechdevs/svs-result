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
    whiteSpace: "nowrap",
    fontWeight: 600,
    fontSize: "13px",
    marginRight: "4px",
  };

  const underlineBase: React.CSSProperties = {
    borderBottom: "1px solid #1f5e9d",
    padding: "0px 4px 10px 4px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    fontSize: "13px",
    textAlign: "center",
    display: "inline-block",
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        width: "100%",
        fontSize: "14px",
        fontWeight: 700,
        fontFamily: '"Arial", sans-serif',
        color: "#1f5e9d",
        padding: "8px 0",
        lineHeight: "1.6",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {/* Line 1: Name + DOB BS */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          width: "100%",
        }}
      >
        <span style={labelStyle}>THE FOLLOWING ARE THE GRADE BY:</span>
        <span
          style={{
            ...underlineBase,
            flex: 2,
            minWidth: "100px",
            textAlign: "center",
          }}
        >
          {studentName}
        </span>
        <span style={labelStyle}>DATE OF BIRTH:</span>
        <span
          style={{
            ...underlineBase,
            flex: 1,
            minWidth: "60px",
            textAlign: "center",
          }}
        >
          {dateOfBirth || "\u00A0"}
        </span>
        <span style={labelStyle}>B. S.</span>
      </div>

      {/* Line 2: DOB AD + Roll + Grade */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          width: "100%",
        }}
      >
        <span style={labelStyle}>(</span>
        <span
          style={{ ...underlineBase, minWidth: "40px", textAlign: "center" }}
        >
          {dateOfBirthAD || "\u00A0"}
        </span>
        <span style={labelStyle}>&nbsp;A.D.)&nbsp;&nbsp;</span>
        <span style={labelStyle}>ROLL NO:</span>
        <span
          style={{
            ...underlineBase,
            flex: 0.5,
            minWidth: "40px",
            textAlign: "center",
          }}
        >
          {rollNo}
        </span>
        <span style={labelStyle}>GRADE:</span>
        <span
          style={{
            ...underlineBase,
            flex: 0.5,
            minWidth: "40px",
            textAlign: "center",
          }}
        >
          {grade}
        </span>
        <span style={labelStyle}>IN THE</span>
      </div>

      {/* Line 3: Exam Year */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          width: "100%",
          marginTop: "6px",
        }}
      >
        <span style={{ ...labelStyle, fontWeight: 900, marginRight: "4px" }}>
          {examName ? examName.toUpperCase() : "EXAMINATION"}
        </span>
        <span style={labelStyle}>CONDUCTED IN</span>
        <span
          style={{ ...underlineBase, minWidth: "45px", textAlign: "center" }}
        >
          {nepaliYear}
        </span>
        <span style={labelStyle}>B.S. ARE GIVEN BELOW.</span>
      </div>
    </div>
  );
}
