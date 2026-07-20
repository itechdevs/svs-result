'use client';

import React from 'react';
import { formatNum } from '@/lib/format-num';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Circle,
  Polygon,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

const COLORS = {
  primary: '#1f5e9d',
  border: '#4a7aa8',
  lightBlue: '#dbeeff',
  rowAlt: '#f8fbff',
  mergedCell: '#f0f6ff',
  text: '#1a1a1a',
  muted: '#6b7280',
  green: '#15803d',
  red: '#dc2626',
};

const styles = PdfStyleSheet.create({
  page: {
    padding: 28,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.text,
    backgroundColor: '#ffffff',
  },
  outerBorder: {
    border: `2pt solid ${COLORS.border}`,
    padding: 12,
    flexGrow: 1,
  },
  innerBorder: {
    border: `1pt solid ${COLORS.border}`,
    margin: 1.5,
    flexGrow: 1,
    padding: '10 12',
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    marginBottom: 6,
  },
  headerLeft: { width: '15%', alignItems: 'center' },
  headerCenter: { width: '70%', alignItems: 'center' },
  headerRight: { width: '15%' },
  logo: { width: 62, height: 62, objectFit: 'contain' },
  schoolName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  schoolAddress: {
    fontSize: 8,
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: 600,
    marginTop: 1,
  },
  schoolContact: {
    fontSize: 7.5,
    textAlign: 'center',
    color: COLORS.primary,
    marginTop: 1,
  },

  // Title
  examTitleSection: {
    alignItems: 'center',
    paddingBottom: 4,

    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 8,
    color: COLORS.muted,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },

  // Student info (certificate style)
  studentInfoSection: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 7,
    lineHeight: 1.6,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoText: { fontFamily: 'Helvetica', color: COLORS.text },
  infoUnderline: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    textDecoration: 'underline',
    paddingHorizontal: 2,
  },

  // Table
  table: {
    border: `1pt solid ${COLORS.border}`,
    marginTop: 6,
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderBottom: `1pt solid ${COLORS.primary}`,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.border}`,
    backgroundColor: COLORS.rowAlt,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    padding: '5 6',
    fontSize: 7.5,
    color: '#ffffff',
    borderRight: `0.5pt solid ${COLORS.border}`,
  },
  td: {
    padding: '4 6',
    fontSize: 7.5,
    borderRight: `0.5pt solid ${COLORS.border}`,
    color: COLORS.text,
  },

  colSn: { width: '6%', textAlign: 'center' },
  colSubject: { width: '32%' },
  colCH: { width: '14%', textAlign: 'center' },
  colGrade: { width: '12%', textAlign: 'center' },
  colGP: { width: '16%', textAlign: 'center' },
  colRemarks: { width: '20%', textAlign: 'center' },

  // GPA strip
  gpaStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
    padding: '5 10',
    borderLeft: `0.5pt solid ${COLORS.border}`,
    borderRight: `0.5pt solid ${COLORS.border}`,
    borderBottom: `0.5pt solid ${COLORS.border}`,
    marginBottom: 10,
  },
  gpaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: COLORS.primary,
  },
  gpaRightValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: COLORS.primary,
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 2,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  statusPromoted: {
    backgroundColor: '#dcfce7',
    color: COLORS.green,
  },
  statusNG: {
    backgroundColor: '#fee2e2',
    color: COLORS.red,
  },

  // Grade Legends
  legendSection: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  legendLeft: { width: '55%' },
  legendRight: { width: '45%' },
  legendTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORS.primary,
    marginBottom: 4,
  },
  legendNote: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: COLORS.primary,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  legendTable: {
    border: `0.5pt solid ${COLORS.border}`,
  },
  legendTh: {
    fontFamily: 'Helvetica-Bold',
    padding: '4 4',
    fontSize: 7,
    color: COLORS.primary,
    borderRight: `0.5pt solid ${COLORS.border}`,
    textAlign: 'center',
  },
  legendTd: {
    fontFamily: 'Helvetica-Bold',
    padding: '2 3',
    fontSize: 6.5,
    borderRight: `0.5pt solid ${COLORS.border}`,
    color: COLORS.primary,
  },
  legendRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  lColSn: { width: '8%', textAlign: 'center' },
  lColInterval: { width: '30%', textAlign: 'center' },
  lColGrade: { width: '14%', textAlign: 'center' },
  lColGP: { width: '16%', textAlign: 'center' },
  lColDesc: { width: '32%', textAlign: 'center' },

  // Remarks
  remarksSection: {
    marginBottom: 6,
    padding: 6,
    backgroundColor: COLORS.lightBlue,
    border: `0.5pt solid ${COLORS.border}`,
    borderRadius: 2,
    fontSize: 7,
  },
  remarksTitle: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 2,
    fontSize: 7.5,
  },
  remarksText: {
    color: COLORS.text,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 4,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: 6,
    marginBottom: 6,
  },
  signatureBox: {
    width: 140,
    borderTop: `1pt solid ${COLORS.primary}`,
    paddingTop: 4,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORS.primary,
  },
  issueDate: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORS.primary,
    marginTop: 8,
  },
});

const formatInterval = (inv: string) => {
  if (inv.includes('100')) return '90 to 100';
  if (inv.includes('90')) return '80 to below 90';
  if (inv.includes('80')) return '70 to below 80';
  if (inv.includes('70')) return '60 to below 70';
  if (inv.includes('60')) return '50 to below 60';
  if (inv.includes('50')) return '40 to below 50';
  if (inv.includes('40')) return '35 to below 40';
  if (inv.includes('35')) return '0 to below 35';
  return inv;
};

const GRADE_INTERVALS = [
  { sn: 1, interval: '90 \u2013 100', grade: 'A+', gp: '4.0', desc: 'Outstanding' },
  { sn: 2, interval: '80 \u2013 <90', grade: 'A', gp: '3.6', desc: 'Excellent' },
  { sn: 3, interval: '70 \u2013 <80', grade: 'B+', gp: '3.2', desc: 'Very Good' },
  { sn: 4, interval: '60 \u2013 <70', grade: 'B', gp: '2.8', desc: 'Good' },
  { sn: 5, interval: '50 \u2013 <60', grade: 'C+', gp: '2.4', desc: 'Satisfactory' },
  { sn: 6, interval: '40 \u2013 <50', grade: 'C', gp: '2.0', desc: 'Acceptable' },
  { sn: 7, interval: '35 \u2013 <40', grade: 'D', gp: '1.6', desc: 'Basic' },
  { sn: 8, interval: '0 \u2013 <35', grade: 'NG', gp: '\u2013', desc: 'Not Graded' },
];

interface AnnualSubjectResult {
  subject: string;
  creditHours: number;
  weightedTotalObtained: number;
  weightedTotalFull: number;
  percentage: number;
  gradePoint: number;
  grade: string;
  isNG: boolean;
}

interface SecondaryAnnualMarksheetData {
  student: {
    name: string;
    rollNumber: string;
    section: string;
    gradeLevel: string;
  };
  academicYear: {
    name: string;
  };
  subjectResults: AnnualSubjectResult[];
  totalSubjects: number;
  passedSubjects: number;
  ngSubjects: number;
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PROMOTED' | 'NG_BLOCKED';
  classRank?: number;
  generatedDate: string;
  remarks?: string;
}

function GradeIntervalTable() {
  return (
    <View style={styles.legendTable}>
      <View style={styles.legendRow}>
        <Text style={[styles.legendTh, styles.lColSn]}>SN</Text>
        <Text style={[styles.legendTh, styles.lColInterval]}>Interval In{'\n'}Percent</Text>
        <Text style={[styles.legendTh, styles.lColGrade]}>Grade</Text>
        <Text style={[styles.legendTh, styles.lColGP]}>Grade{'\n'}Point</Text>
        <Text style={[styles.legendTh, styles.lColDesc, { borderRight: 0 }]}>Description</Text>
      </View>
      {GRADE_INTERVALS.map((row, i) => (
        <View key={i} style={styles.legendRow}>
          <Text style={[styles.legendTd, styles.lColSn]}>{row.sn}</Text>
          <Text style={[styles.legendTd, styles.lColInterval]}>{formatInterval(row.interval)}</Text>
          <Text style={[styles.legendTd, styles.lColGrade]}>
            {row.grade}
          </Text>
          <Text style={[styles.legendTd, styles.lColGP]}>{row.gp}</Text>
          <Text style={[styles.legendTd, styles.lColDesc, { borderRight: 0 }]}>{row.desc}</Text>
        </View>
      ))}
    </View>
  );
}

export function SecondaryAnnualMarksheetPDF({ data }: { data: SecondaryAnnualMarksheetData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Diagonal Repeating Text Pattern */}
            <View style={{
              position: 'absolute',
              top: -100,
              left: -100,
              right: -100,
              bottom: -100,
              transform: 'rotate(-25deg)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <Text
                  key={i}
                  style={{
                    color: COLORS.primary,
                    opacity: 0.045,
                    fontSize: 10,
                    fontFamily: 'Helvetica-Bold',
                    letterSpacing: 2,
                    marginBottom: 28,
                  }}
                >
                  {`${'SANSKAR VIDHYAPITH SCHOOL    '.repeat(10)}`}
                </Text>
              ))}
            </View>

            {/* Watermark Logo */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -1 }}>
              <Image src="/SVS LOGO NEW.png" style={{ width: 500, height: 500, opacity: 0.1 }} />
            </View>

            {/* School Header */}
            <View style={styles.headerSection}>
              <View style={styles.headerLeft}>
                <Image src="/SVS LOGO NEW.png" style={styles.logo} />
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.schoolName}>Sanskar Vidhyapith School</Text>
                <Text style={styles.schoolAddress}>Balkhu, Kathmandu, Nepal</Text>
                <Text style={styles.schoolContact}>Phone: 9802036680 | Email: sanskarvschool@gmail.com</Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            {/* Title */}
            <View style={styles.examTitleSection}>
              <Text style={styles.sheetTitle}>Annual Transcript</Text>
              <Text style={styles.subtitle}>Academic Year: {data.academicYear.name}</Text>
            </View>

            {/* Student Info (Certificate Style) */}
            <View style={styles.studentInfoSection}>
              <View style={styles.infoLine}>
                <Text style={styles.infoText}>THE FOLLOWING ARE THE GRADES BY: </Text>
                <Text style={styles.infoUnderline}>{data.student.name.toUpperCase()}</Text>
                <Text style={styles.infoText}>  DATE OF BIRTH: </Text>
                <Text style={styles.infoUnderline}>2079-01-01</Text>
                <Text style={styles.infoText}> B.S. ( </Text>
                <Text style={styles.infoUnderline}>2022-04-14</Text>
                <Text style={styles.infoText}> A.D.)  ROLL NO: </Text>
                <Text style={styles.infoUnderline}>{data.student.rollNumber}</Text>
                <Text style={styles.infoText}>  GRADE: </Text>
                <Text style={styles.infoUnderline}>{data.student.gradeLevel}</Text>
              </View>
              <View style={[styles.infoLine, { marginTop: 4 }]}>
                <Text style={styles.infoText}>IN THE FINAL EXAMINATION CONDUCTED BY SCHOOL ARE GIVEN BELOW.</Text>
              </View>
            </View>

            {/* Marks Table */}
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: '#ffffff' }]}>
                <Text style={[styles.th, styles.colSn, { color: COLORS.primary }]}>S.N.</Text>
                <Text style={[styles.th, styles.colSubject, { color: COLORS.primary }]}>SUBJECTS</Text>
                <Text style={[styles.th, styles.colCH, { color: COLORS.primary }]}>CREDIT HOUR (CH)</Text>
                <Text style={[styles.th, styles.colGrade, { color: COLORS.primary }]}>GRADE</Text>
                <Text style={[styles.th, styles.colGP, { color: COLORS.primary }]}>GRADE POINT</Text>
                <Text style={[styles.th, styles.colRemarks, { borderRight: 0, color: COLORS.primary }]}>REMARKS</Text>
              </View>

              {data.subjectResults.map((subject, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.td, styles.colSn]}>{index + 1}.</Text>
                  <Text style={[styles.td, styles.colSubject, { fontFamily: 'Helvetica-Bold' }]}>
                    {subject.subject.toUpperCase()}
                  </Text>
                  <Text style={[styles.td, styles.colCH]}>{formatNum(subject.creditHours, 2)}</Text>
                  <Text style={[styles.td, styles.colGrade, { fontFamily: 'Helvetica-Bold' }]}>
                    {subject.grade}
                  </Text>
                  <Text style={[styles.td, styles.colGP, { fontFamily: 'Helvetica-Bold' }]}>
                    {subject.gradePoint > 0 ? formatNum(subject.gradePoint, 2) : '\u2013'}
                  </Text>
                  <Text style={[styles.td, styles.colRemarks, {
                    borderRight: 0,
                    fontFamily: 'Helvetica',
                  }]}>
                    {GRADE_INTERVALS.find(g => g.grade === subject.grade)?.desc || 'Unknown'}.
                  </Text>
                </View>
              ))}
            </View>

            {/* GPA Strip */}
            <View style={styles.gpaStrip}>
              <Text style={styles.gpaLabel}>Grade Point Average (GPA) = {formatNum(data.gpa, 2)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.gpaRightValue}>Rank = {data.classRank || 1}</Text>
              </View>
            </View>

            {/* Remarks */}
            {data.remarks && (
              <View style={styles.remarksSection}>
                <Text style={styles.remarksTitle}>Remarks:</Text>
                <Text style={styles.remarksText}>{data.remarks}</Text>
              </View>
            )}

            {/* Grade Legend */}
            <View style={styles.legendSection}>
              <View style={[styles.legendLeft, { paddingRight: 4 }]}>
                <Text style={styles.legendTitle}>Note:</Text>
                <Text style={styles.legendNote}>1. One Credit Hour Equals To 32 Working Hours.</Text>
                <Text style={styles.legendNote}>2. INTERNAL(IN): This Covers The Participation, Practical/Project Works & Terminal Examination.</Text>
                <Text style={styles.legendNote}>3. EXTERNAL(TH): This Covers Written External Examination.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.legendNote}>4. ABS: Absent</Text>
                  <Text style={styles.legendNote}>5. *NG: Not Graded</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Text style={styles.legendNote}>6. GPA = </Text>
                  <View style={{ alignItems: 'center', marginLeft: 4 }}>
                    <Text style={[styles.legendNote, { borderBottom: `1pt solid ${COLORS.primary}`, paddingBottom: 1 }]}>
                      Σ(Credit Hour*Grade Point)
                    </Text>
                    <Text style={[styles.legendNote, { paddingTop: 1 }]}>
                      Total Credit Hour of the Grade
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendTitle, { textAlign: 'center' }]}>Intervals and Grade</Text>
                <GradeIntervalTable />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.signatureRow}>
                <View style={{ width: 140 }}>
                  <View style={styles.signatureBox}>
                    <Text>CLASS TEACHER</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: COLORS.primary }}>DATE OF ISSUE: </Text>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#000000' }}>{data.generatedDate}</Text>
                  </View>
                </View>
                <View style={{ width: 140 }}>
                  <View style={styles.signatureBox}>
                    <Text>PRINCIPAL</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
