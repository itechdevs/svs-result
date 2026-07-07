'use client';

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
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
    margin: 3,
    flexGrow: 1,
    padding: '10 12',
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottom: `1.5pt solid ${COLORS.border}`,
    marginBottom: 6,
  },
  headerLeft: { width: '15%', alignItems: 'center' },
  headerCenter: { width: '70%', alignItems: 'center' },
  headerRight: { width: '15%' },
  logo: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: COLORS.primary },
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
    borderBottom: `1pt solid ${COLORS.border}`,
    marginBottom: 6,
  },
  examLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  examSubtitle: {
    fontSize: 8,
    color: COLORS.muted,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },

  // Student info (certificate style)
  studentInfoSection: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 8,
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
    marginBottom: 8,
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
  colSubject: { width: '28%' },
  colCH: { width: '7%', textAlign: 'center' },
  colMarks: { width: '22%', textAlign: 'center' },
  colGP: { width: '9%', textAlign: 'center' },
  colGrade: { width: '10%', textAlign: 'center' },
  colFinalGrade: { width: '9%', textAlign: 'center' },
  colRemarks: { width: '9%', textAlign: 'center' },

  // GPA strip
  gpaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    border: `1pt solid ${COLORS.border}`,
    padding: '5 10',
    marginBottom: 6,
  },
  gpaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: COLORS.primary,
  },
  gpaValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: COLORS.primary,
  },
  gpaSeparator: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: COLORS.border,
  },
  gpaRightValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
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

  // Grade Legend
  legendSection: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  legendLeft: { width: '45%' },
  legendRight: { width: '55%' },
  legendTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: COLORS.primary,
    marginBottom: 2,
  },
  legendNote: {
    fontSize: 6.5,
    color: COLORS.muted,
    lineHeight: 1.5,
    marginBottom: 1,
  },
  legendTable: {
    border: `0.5pt solid ${COLORS.border}`,
  },
  legendTh: {
    fontFamily: 'Helvetica-Bold',
    padding: '2 3',
    fontSize: 6,
    color: '#ffffff',
    backgroundColor: COLORS.primary,
    borderRight: `0.5pt solid ${COLORS.border}`,
  },
  legendTd: {
    padding: '2 3',
    fontSize: 6,
    borderRight: `0.5pt solid ${COLORS.border}`,
    color: COLORS.text,
  },
  legendRow: {
    flexDirection: 'row',
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  lColSn: { width: '10%', textAlign: 'center' },
  lColInterval: { width: '22%', textAlign: 'center' },
  lColGrade: { width: '15%', textAlign: 'center' },
  lColGP: { width: '18%', textAlign: 'center' },
  lColDesc: { width: '35%', textAlign: 'center' },

  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTop: `1pt solid ${COLORS.border}`,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  signatureBox: {
    width: 120,
    borderTop: `1pt solid ${COLORS.text}`,
    paddingTop: 3,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: COLORS.text,
  },
  issueDate: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: COLORS.muted,
    textAlign: 'right',
  },
});

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

interface SubjectResult {
  subject: string;
  creditHours: number;
  internalMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  totalObtained: number;
  totalFullMarks: number;
  gradePoint: number;
  grade: string;
  isNG: boolean;
}

interface SecondaryTermMarksheetData {
  student: {
    name: string;
    rollNumber: string;
    section: string;
    gradeLevel: string;
  };
  exam: {
    name: string;
  };
  academicYear: {
    name: string;
  };
  subjectResults: SubjectResult[];
  totalSubjects: number;
  passedSubjects: number;
  ngSubjects: number;
  totalCreditHours: number;
  gpa: number;
  resultStatus: 'PROMOTED' | 'NG_BLOCKED';
  generatedDate: string;
}

function GradeIntervalTable() {
  return (
    <View style={styles.legendTable}>
      <View style={[styles.legendRow, { backgroundColor: COLORS.primary }]}>
        <Text style={[styles.legendTh, styles.lColSn]}>SN</Text>
        <Text style={[styles.legendTh, styles.lColInterval]}>Interval (%)</Text>
        <Text style={[styles.legendTh, styles.lColGrade]}>Grade</Text>
        <Text style={[styles.legendTh, styles.lColGP]}>Grade Point</Text>
        <Text style={[styles.legendTh, styles.lColDesc, { borderRight: 0 }]}>Description</Text>
      </View>
      {GRADE_INTERVALS.map((row, i) => (
        <View key={i} style={i % 2 === 0 ? styles.legendRow : { ...styles.legendRow, backgroundColor: COLORS.rowAlt }}>
          <Text style={[styles.legendTd, styles.lColSn]}>{row.sn}</Text>
          <Text style={[styles.legendTd, styles.lColInterval]}>{row.interval}</Text>
          <Text style={[styles.legendTd, styles.lColGrade, { fontFamily: 'Helvetica-Bold', color: row.grade === 'NG' ? COLORS.red : COLORS.primary }]}>
            {row.grade}
          </Text>
          <Text style={[styles.legendTd, styles.lColGP]}>{row.gp}</Text>
          <Text style={[styles.legendTd, styles.lColDesc, { borderRight: 0 }]}>{row.desc}</Text>
        </View>
      ))}
    </View>
  );
}

export function SecondaryTermMarksheetPDF({ data }: { data: SecondaryTermMarksheetData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* School Header */}
            <View style={styles.headerSection}>
              <View style={styles.headerLeft}>
                <Text style={styles.logo}>SVS</Text>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.schoolName}>Sanskar Vidhyapith School</Text>
                <Text style={styles.schoolAddress}>Balkhu, Kathmandu, Nepal</Text>
                <Text style={styles.schoolContact}>Phone: 9802036680 | Email: sanskarvschool@gmail.com</Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            {/* Exam Title */}
            <View style={styles.examTitleSection}>
              <Text style={styles.examLabel}>FINAL EXAMINATION</Text>
              <Text style={styles.sheetTitle}>GRADE SHEET</Text>
              <Text style={styles.examSubtitle}>{data.exam.name} — {data.academicYear.name}</Text>
            </View>

            {/* Student Info (Certificate Style) */}
            <View style={styles.studentInfoSection}>
              <View style={styles.infoLine}>
                <Text style={styles.infoText}>THE GRADE(S) SECURED BY: </Text>
                <Text style={styles.infoUnderline}>{data.student.name.toUpperCase()}</Text>
                <Text style={styles.infoText}>  ROLL NO: </Text>
                <Text style={styles.infoUnderline}>{data.student.rollNumber}</Text>
                <Text style={styles.infoText}>  GRADE: </Text>
                <Text style={styles.infoUnderline}>{data.student.gradeLevel}</Text>
              </View>
              <View style={styles.infoLine}>
                <Text style={styles.infoText}>IN THE FINAL EXAMINATION CONDUCTED IN </Text>
                <Text style={styles.infoUnderline}>2082</Text>
                <Text style={styles.infoText}> B.S. ( </Text>
                <Text style={styles.infoUnderline}>2026</Text>
                <Text style={styles.infoText}> A.D.) ARE GIVEN BELOW.</Text>
              </View>
            </View>

            {/* Marks Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colSn]}>SN</Text>
                <Text style={[styles.th, styles.colSubject]}>Subject</Text>
                <Text style={[styles.th, styles.colCH]}>C.H.</Text>
                <Text style={[styles.th, styles.colMarks]}>Marks Obtained</Text>
                <Text style={[styles.th, styles.colGP]}>G.P.</Text>
                <Text style={[styles.th, styles.colGrade]}>Grade</Text>
                <Text style={[styles.th, styles.colFinalGrade, { borderRight: 0 }]}>Final Grade</Text>
              </View>

              {data.subjectResults.map((subject, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.td, styles.colSn]}>{index + 1}</Text>
                  <Text style={[styles.td, styles.colSubject, { fontFamily: 'Helvetica-Bold' }]}>
                    {subject.subject}
                    {subject.isNG && <Text style={{ color: COLORS.red }}> (NG)</Text>}
                  </Text>
                  <Text style={[styles.td, styles.colCH]}>{subject.creditHours}</Text>
                  <Text style={[styles.td, styles.colMarks]}>
                    {subject.totalObtained}/{subject.totalFullMarks}
                  </Text>
                  <Text style={[styles.td, styles.colGP, { fontFamily: 'Helvetica-Bold' }]}>
                    {subject.gradePoint.toFixed(2)}
                  </Text>
                  <Text style={[styles.td, styles.colGrade, {
                    fontFamily: 'Helvetica-Bold',
                    color: subject.isNG ? COLORS.red : COLORS.green,
                  }]}>
                    {subject.grade}
                  </Text>
                  <Text style={[styles.td, styles.colFinalGrade, {
                    borderRight: 0,
                    fontFamily: 'Helvetica-Bold',
                    backgroundColor: COLORS.mergedCell,
                    color: subject.isNG ? COLORS.red : COLORS.green,
                  }]}>
                    {subject.grade}
                  </Text>
                </View>
              ))}
            </View>

            {/* GPA Strip */}
            <View style={styles.gpaStrip}>
              <Text style={styles.gpaLabel}>Grade Point Average (GPA): {data.gpa.toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.gpaSeparator}>|</Text>
                <Text style={styles.gpaRightValue}>
                  {data.resultStatus === 'PROMOTED' ? 'PROMOTED' : 'NG BLOCKED'}
                </Text>
              </View>
            </View>

            {/* Grade Legend */}
            <View style={styles.legendSection}>
              <View style={styles.legendLeft}>
                <Text style={styles.legendTitle}>Notes:</Text>
                <Text style={styles.legendNote}>ABS: Absent</Text>
                <Text style={styles.legendNote}>NG: Not Graded (Below 35%)</Text>
                <Text style={styles.legendNote}>C.H. = Credit Hours</Text>
                <Text style={styles.legendNote}>G.P. = Grade Point</Text>
                <Text style={styles.legendNote}>Students must pass all subjects</Text>
                <Text style={styles.legendNote}>to be promoted.</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendTitle}>Intervals and Grade:</Text>
                <GradeIntervalTable />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.signatureRow}>
                <View style={styles.signatureBox}>
                  <Text>CLASS TEACHER</Text>
                </View>
                <View style={styles.signatureBox}>
                  <Text>PRINCIPAL</Text>
                </View>
              </View>
              <Text style={styles.issueDate}>Date of Issue: {data.generatedDate}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
