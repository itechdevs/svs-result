'use client';

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

const styles = PdfStyleSheet.create({
  page: { 
    padding: 30, 
    fontFamily: 'Helvetica', 
    fontSize: 9, 
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  outerBorder: { 
    border: '2pt solid #1e3a8a', 
    padding: 16, 
    flexGrow: 1 
  },
  
  // Header Styles
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 12,
    borderBottom: '1pt solid #e5e7eb',
    paddingBottom: 12
  },
  schoolName: { 
    fontSize: 16, 
    fontFamily: 'Helvetica-Bold', 
    textAlign: 'center', 
    textTransform: 'uppercase',
    color: '#1e3a8a',
    marginBottom: 4
  },
  schoolAddress: { 
    fontSize: 8, 
    textAlign: 'center', 
    color: '#6b7280',
    marginBottom: 2
  },
  marksheetTitle: { 
    fontSize: 13, 
    fontFamily: 'Helvetica-Bold', 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginTop: 8,
    color: '#1e3a8a'
  },
  examName: { 
    fontSize: 10, 
    fontFamily: 'Helvetica-Bold', 
    marginTop: 4,
    color: '#374151'
  },
  
  // Student Info Styles
  studentInfo: { 
    marginTop: 12, 
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 4
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 4, 
    fontSize: 8.5 
  },
  infoLabel: { 
    fontFamily: 'Helvetica-Bold',
    minWidth: 100,
    color: '#374151'
  },
  infoValue: { 
    fontFamily: 'Helvetica',
    color: '#1f2937',
    flex: 1
  },
  
  // Table Styles
  table: { 
    border: '1pt solid #d1d5db', 
    marginTop: 10,
    marginBottom: 12
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#1e3a8a',
    borderBottom: '1pt solid #1e3a8a'
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottom: '0.5pt solid #e5e7eb'
  },
  tableRowAlt: { 
    flexDirection: 'row', 
    borderBottom: '0.5pt solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  th: { 
    fontFamily: 'Helvetica-Bold', 
    padding: '6 8', 
    fontSize: 8,
    color: '#ffffff',
    borderRight: '0.5pt solid #ffffff'
  },
  td: { 
    padding: '5 8', 
    fontSize: 8,
    borderRight: '0.5pt solid #e5e7eb',
    color: '#374151'
  },
  
  // Column Widths
  colSn: { width: '6%', textAlign: 'center' },
  colSubject: { width: '30%' },
  colCH: { width: '8%', textAlign: 'center' },
  colInternal: { width: '10%', textAlign: 'center' },
  colTheory: { width: '10%', textAlign: 'center' },
  colPractical: { width: '10%', textAlign: 'center' },
  colTotal: { width: '10%', textAlign: 'center' },
  colGP: { width: '8%', textAlign: 'center' },
  colGrade: { width: '8%', textAlign: 'center' },
  
  // Summary Section
  summarySection: { 
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f9ff',
    border: '1pt solid #bae6fd',
    borderRadius: 4
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 6,
    fontSize: 9
  },
  summaryLabel: { 
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a'
  },
  summaryValue: { 
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937'
  },
  gpaRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTop: '1pt solid #bae6fd',
    fontSize: 11
  },
  gpaLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    fontSize: 10
  },
  gpaValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    fontSize: 12
  },
  
  // Status Badge
  statusBadge: {
    padding: '3 8',
    borderRadius: 3,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 4
  },
  statusPromoted: {
    backgroundColor: '#dcfce7',
    color: '#15803d'
  },
  statusNG: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  
  // Footer Styles
  footer: { 
    marginTop: 24,
    paddingTop: 12,
    borderTop: '1pt solid #e5e7eb'
  },
  signatureRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20,
    marginBottom: 12
  },
  signatureBox: { 
    width: 140, 
    borderTop: '1pt solid #374151', 
    paddingTop: 4, 
    textAlign: 'center', 
    fontFamily: 'Helvetica-Bold', 
    fontSize: 8,
    color: '#374151'
  },
  issueDate: { 
    fontFamily: 'Helvetica', 
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right'
  },
  
  // Grade Legend
  gradeLegend: {
    marginTop: 10,
    fontSize: 7,
    color: '#6b7280',
    lineHeight: 1.4
  },
  legendTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    fontSize: 8
  }
});

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

export function SecondaryTermMarksheetPDF({ data }: { data: SecondaryTermMarksheetData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={styles.schoolName}>Sanskar Vidhyapith School</Text>
            <Text style={styles.schoolAddress}>Balkhu, Kathmandu | Phone: 9802036680 | Email: sanskarvschool@gmail.com</Text>
            <Text style={styles.marksheetTitle}>Term Marksheet</Text>
            <Text style={styles.examName}>{data.exam.name} - {data.academicYear.name}</Text>
          </View>
          
          {/* Student Information */}
          <View style={styles.studentInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Student Name:</Text>
              <Text style={styles.infoValue}>{data.student.name}</Text>
              <Text style={[styles.infoLabel, { marginLeft: 40 }]}>Roll Number:</Text>
              <Text style={styles.infoValue}>{data.student.rollNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Grade:</Text>
              <Text style={styles.infoValue}>{data.student.gradeLevel}</Text>
              <Text style={[styles.infoLabel, { marginLeft: 40 }]}>Section:</Text>
              <Text style={styles.infoValue}>{data.student.section || 'N/A'}</Text>
            </View>
          </View>
          
          {/* Marks Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colSn]}>S.N.</Text>
              <Text style={[styles.th, styles.colSubject]}>Subject</Text>
              <Text style={[styles.th, styles.colCH]}>C.H.</Text>
              <Text style={[styles.th, styles.colInternal]}>Internal</Text>
              <Text style={[styles.th, styles.colTheory]}>Theory</Text>
              <Text style={[styles.th, styles.colPractical]}>Practical</Text>
              <Text style={[styles.th, styles.colTotal]}>Total</Text>
              <Text style={[styles.th, styles.colGP]}>G.P.</Text>
              <Text style={[styles.th, styles.colGrade, { borderRight: 0 }]}>Grade</Text>
            </View>
            
            {/* Table Rows */}
            {data.subjectResults.map((subject, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.td, styles.colSn]}>{index + 1}</Text>
                <Text style={[styles.td, styles.colSubject, { fontFamily: 'Helvetica-Bold' }]}>
                  {subject.subject}
                  {subject.isNG && <Text style={{ color: '#dc2626' }}> (NG)</Text>}
                </Text>
                <Text style={[styles.td, styles.colCH]}>{subject.creditHours}</Text>
                <Text style={[styles.td, styles.colInternal]}>{subject.internalMarks > 0 ? subject.internalMarks : '-'}</Text>
                <Text style={[styles.td, styles.colTheory]}>{subject.theoryMarks > 0 ? subject.theoryMarks : '-'}</Text>
                <Text style={[styles.td, styles.colPractical]}>{subject.practicalMarks > 0 ? subject.practicalMarks : '-'}</Text>
                <Text style={[styles.td, styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                  {subject.totalObtained}/{subject.totalFullMarks}
                </Text>
                <Text style={[styles.td, styles.colGP, { fontFamily: 'Helvetica-Bold' }]}>
                  {subject.gradePoint.toFixed(2)}
                </Text>
                <Text style={[styles.td, styles.colGrade, { 
                  borderRight: 0, 
                  fontFamily: 'Helvetica-Bold',
                  color: subject.isNG ? '#dc2626' : '#15803d'
                }]}>
                  {subject.grade}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Subjects:</Text>
              <Text style={styles.summaryValue}>{data.totalSubjects}</Text>
              <Text style={[styles.summaryLabel, { marginLeft: 40 }]}>Passed:</Text>
              <Text style={[styles.summaryValue, { color: '#15803d' }]}>{data.passedSubjects}</Text>
              <Text style={[styles.summaryLabel, { marginLeft: 40 }]}>NG (Not Graded):</Text>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>{data.ngSubjects}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Credit Hours:</Text>
              <Text style={styles.summaryValue}>{data.totalCreditHours}</Text>
            </View>
            <View style={styles.gpaRow}>
              <Text style={styles.gpaLabel}>Grade Point Average (GPA):</Text>
              <Text style={styles.gpaValue}>{data.gpa.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={[
                styles.statusBadge, 
                data.resultStatus === 'PROMOTED' ? styles.statusPromoted : styles.statusNG
              ]}>
                <Text>{data.resultStatus === 'PROMOTED' ? 'PROMOTED' : 'NOT GRADED (NG)'}</Text>
              </View>
            </View>
          </View>
          
          {/* Grade Legend */}
          <View style={styles.gradeLegend}>
            <Text style={styles.legendTitle}>Grading System:</Text>
            <Text>A+ (90-100) = 4.0 | A (80-89) = 3.6 | B+ (70-79) = 3.2 | B (60-69) = 2.8 | C+ (50-59) = 2.4 | C (40-49) = 2.0 | D+ (30-39) = 1.6 | D (20-29) = 1.2 | NG (0-19) = Not Graded</Text>
            <Text style={{ marginTop: 2 }}>C.H. = Credit Hours | G.P. = Grade Point | NG = Not Graded (Below 35%)</Text>
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
      </Page>
    </Document>
  );
}
