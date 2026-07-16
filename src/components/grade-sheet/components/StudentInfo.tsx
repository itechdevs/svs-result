// ─────────────────────────────────────────────
//  StudentInfo — Certificate-style student details
// ─────────────────────────────────────────────

interface StudentInfoProps {
  studentName: string;
  rollNo: string;
  grade: string;
  nepaliYear: string;
  englishYear: string;
}

export default function StudentInfo({
  studentName,
  rollNo,
  grade,
  nepaliYear,
  englishYear,
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
        lineHeight: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          width: "100%",
          marginBottom: "2px",
        }}
      >
        <span style={labelStyle}>THE GRADE(S) SECURED BY: </span>
        <span
          style={{
            ...underlineStyle,
            fontWeight: 800,
            flex: 1,
            minWidth: "80px",
          }}
        >
          {studentName}
        </span>
        <span style={labelStyle}>&nbsp;&nbsp;ROLL NO: </span>
        <span style={{ ...underlineStyle, minWidth: "30px" }}>{rollNo}</span>
        <span style={labelStyle}>&nbsp;&nbsp;GRADE: </span>
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
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          flexWrap: "wrap",
          width: "100%",
          marginTop: "2px",
        }}
      >
        <span style={labelStyle}>IN THE EXAMINATION CONDUCTED IN </span>
        <span style={{ ...underlineStyle, minWidth: "38px" }}>
          {nepaliYear}
        </span>
        <span style={labelStyle}>&nbsp;B.S. (&nbsp;</span>
        {/* <span style={{ ...underlineStyle, minWidth: '38px' }}>{englishYear}</span> */}
        <span style={labelStyle}>&nbsp;A.D.) ARE GIVEN BELOW.</span>
      </div>
    </div>
  );
}
