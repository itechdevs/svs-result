'use client';

import React from 'react';
import { SCHOOL_CONFIG } from '@/constants';
import { Student } from '@/types/academic';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';
import { MergedScore } from '@/lib/transcript-utils';
import { formatToBSDateString } from '@/lib/bs-calendar';

const pdfStyles = PdfStyleSheet.create({
  page: { padding: 28, fontFamily: 'Helvetica', fontSize: 8, color: '#002045' },
  outerBorder: { border: '2pt solid #002045', padding: 14, flexGrow: 1 },
  headerRow: { alignItems: 'center', marginBottom: 10 },
  schoolName: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase' },
  subHeader: { fontSize: 8, textAlign: 'center', marginTop: 2 },
  examTitle: { alignItems: 'center', marginVertical: 8 },
  examLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2 },
  sheetTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  divider: { borderBottom: '1pt solid #002045', width: 160, marginTop: 3 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 5, fontSize: 7.5 },
  infoLabel: { fontFamily: 'Helvetica' },
  infoValue: { fontFamily: 'Helvetica-Bold', borderBottom: '0.5pt solid #002045', minWidth: 80, paddingHorizontal: 4 },
  table: { border: '0.5pt solid #002045', marginTop: 10 },
  thead: { flexDirection: 'row', backgroundColor: '#f0f4f8' },
  tr: { flexDirection: 'row', borderTop: '0.5pt solid #002045' },
  th: { fontFamily: 'Helvetica-Bold', padding: '4 6', borderRight: '0.5pt solid #002045', fontSize: 7.5 },
  td: { padding: '4 6', borderRight: '0.5pt solid #002045', fontSize: 7.5 },
  colSubject: { width: '45%' },
  colGp: { width: '20%', textAlign: 'center' },
  colGrade: { width: '15%', textAlign: 'center' },
  colRemark: { width: '20%' },
  gpaBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    border: '0.5pt solid #002045', backgroundColor: '#f0f4f8',
    padding: '5 8', marginTop: 6, fontFamily: 'Helvetica-Bold', fontSize: 8,
  },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
  sigBox: { width: 100, borderTop: '0.5pt solid #002045', paddingTop: 3, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  dateText: { marginTop: 8, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
});

export function GradeSheetPDF({
  student,
  mergedScoresList,
  gpa,
  rank,
}: {
  student: Student;
  mergedScoresList: MergedScore[];
  gpa: string;
  rank: number | string;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.outerBorder}>
          <View style={pdfStyles.headerRow}>
            <Text style={pdfStyles.schoolName}>{SCHOOL_CONFIG.nameShort}</Text>
            <Text style={pdfStyles.subHeader}>{SCHOOL_CONFIG.address}</Text>
            <Text style={pdfStyles.subHeader}>Phone: {SCHOOL_CONFIG.phone} | Email: {SCHOOL_CONFIG.emailAlt}</Text>
          </View>
          <View style={pdfStyles.examTitle}>
            <Text style={pdfStyles.examLabel}>Final Examination</Text>
            <Text style={pdfStyles.sheetTitle}>Grade Sheet</Text>
            <View style={pdfStyles.divider} />
          </View>
          <View style={{ marginTop: 12, gap: 5 }}>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>The Grade(s) Secured By: </Text>
              <Text style={pdfStyles.infoValue}>{student.name.toUpperCase()}</Text>
              <Text style={pdfStyles.infoLabel}>  Roll No: </Text>
              <Text style={[pdfStyles.infoValue, { minWidth: 30 }]}>{student.rollNo}</Text>
              <Text style={pdfStyles.infoLabel}>  Grade: </Text>
              <Text style={[pdfStyles.infoValue, { minWidth: 50 }]}>{student.class.toUpperCase()}</Text>
            </View>
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>In the Final Examination Conducted in </Text>
              <Text style={[pdfStyles.infoValue, { minWidth: 30 }]}>2082</Text>
              <Text style={pdfStyles.infoLabel}> B.S. ( </Text>
              <Text style={[pdfStyles.infoValue, { minWidth: 30 }]}>2026</Text>
              <Text style={pdfStyles.infoLabel}> A.D.) Are Given Below.</Text>
            </View>
          </View>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.thead}>
              <Text style={[pdfStyles.th, pdfStyles.colSubject]}>SUBJECTS</Text>
              <Text style={[pdfStyles.th, pdfStyles.colGp]}>GRADE POINT (GP)</Text>
              <Text style={[pdfStyles.th, pdfStyles.colGrade]}>GRADE</Text>
              <Text style={[pdfStyles.th, pdfStyles.colRemark, { borderRight: 0 }]}>REMARKS</Text>
            </View>
            {mergedScoresList.map((s, i) => (
              <View key={i} style={pdfStyles.tr}>
                <Text style={[pdfStyles.td, pdfStyles.colSubject, { fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }]}>
                  {s.subject}
                </Text>
                <Text style={[pdfStyles.td, pdfStyles.colGp]}>{String(s.gp)}</Text>
                <Text style={[pdfStyles.td, pdfStyles.colGrade]}>{s.grade}</Text>
                <Text style={[pdfStyles.td, pdfStyles.colRemark, { borderRight: 0 }]}>{s.remark}</Text>
              </View>
            ))}
          </View>
          <View style={pdfStyles.gpaBar}>
            <Text>Grade Point Average (GPA) = {gpa}</Text>
            <Text>Rank = {rank}</Text>
          </View>
          <View style={pdfStyles.sigRow}>
            <View style={pdfStyles.sigBox}><Text>CLASS TEACHER</Text></View>
            <View style={pdfStyles.sigBox}><Text>PRINCIPAL</Text></View>
          </View>
          <Text style={pdfStyles.dateText}>DATE OF ISSUE: {formatToBSDateString(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
