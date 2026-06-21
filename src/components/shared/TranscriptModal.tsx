'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Student } from '@/types/academic';
import dynamic from 'next/dynamic';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface TranscriptModalProps {
  showTranscriptModal: Student | null;
  setShowTranscriptModal: (student: Student | null) => void;
}

export interface MergedScore {
  subject: string;
  obtained: number;
  max: number;
  percentage: number;
  grade: string;
  gp: number | string;
  remark: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getGradeDetails = (percentage: number) => {
  if (percentage >= 90) return { grade: 'A+', gp: 4.0, remark: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', gp: 3.6, remark: 'Excellent' };
  if (percentage >= 70) return { grade: 'B+', gp: 3.2, remark: 'Very Good' };
  if (percentage >= 60) return { grade: 'B', gp: 2.8, remark: 'Good' };
  if (percentage >= 50) return { grade: 'C+', gp: 2.4, remark: 'Satisfactory' };
  if (percentage >= 40) return { grade: 'C', gp: 2.0, remark: 'Acceptable' };
  if (percentage >= 35) return { grade: 'D', gp: 1.6, remark: 'Basic' };
  return { grade: 'NG', gp: 0.0, remark: 'Not Graded' };
};

export function buildMergedScores(scores: any[]): MergedScore[] {
  const map: Record<string, { obtained: number; max: number }> = {};
  scores.forEach((s: any) => {
    const base = s.subject.replace(/\s*\((TH|IN|Theory|Internal|External)\)\s*$/i, '').trim();
    if (!map[base]) map[base] = { obtained: 0, max: 0 };
    map[base].obtained += s.obtained;
    map[base].max += s.max;
  });
  return Object.entries(map).map(([subject, data]) => {
    const pct = data.max > 0 ? (data.obtained / data.max) * 100 : 0;
    const g = getGradeDetails(pct);
    return {
      subject, obtained: data.obtained, max: data.max, percentage: pct,
      grade: g.grade, gp: g.grade === 'NG' ? '-' : g.gp.toFixed(1), remark: g.remark,
    };
  });
}

export function computeGpa(mergedScores: MergedScore[]): string {
  const vals = mergedScores
    .map(s => typeof s.gp === 'number' ? s.gp : parseFloat(s.gp as string))
    .filter(v => !isNaN(v));
  return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : '0.00';
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

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
          {/* School header */}
          <View style={pdfStyles.headerRow}>
            <Text style={pdfStyles.schoolName}>Sanskar Vidhyapith School</Text>
            <Text style={pdfStyles.subHeader}>Balkhu, Kathmandu</Text>
            <Text style={pdfStyles.subHeader}>Phone: 9802036680 | Email: sanskarvschool@gmail.com</Text>
          </View>

          {/* Exam title */}
          <View style={pdfStyles.examTitle}>
            <Text style={pdfStyles.examLabel}>Final Examination</Text>
            <Text style={pdfStyles.sheetTitle}>Grade Sheet</Text>
            <View style={pdfStyles.divider} />
          </View>

          {/* Student info */}
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

          {/* Marks table */}
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

          {/* GPA + Rank */}
          <View style={pdfStyles.gpaBar}>
            <Text>Grade Point Average (GPA) = {gpa}</Text>
            <Text>Rank = {rank}</Text>
          </View>

          {/* Signatures */}
          <View style={pdfStyles.sigRow}>
            <View style={pdfStyles.sigBox}><Text>CLASS TEACHER</Text></View>
            <View style={pdfStyles.sigBox}><Text>PRINCIPAL</Text></View>
          </View>
          <Text style={pdfStyles.dateText}>DATE OF ISSUE: 2082-12-28</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function TranscriptModal({
  showTranscriptModal,
  setShowTranscriptModal,
}: TranscriptModalProps) {

  if (!showTranscriptModal) return null;

  const mergedScoresList = buildMergedScores(showTranscriptModal.scores);
  const gpa = computeGpa(mergedScoresList);
  const rank = (showTranscriptModal as any).rank ?? (showTranscriptModal as any).classRank ?? 3;

  const handlePrint = () => {
    document.body.classList.add('printing-grade-sheet');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-grade-sheet');
    }, { once: true });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-slate-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sanskar Vidhyapith School Grade Sheet</span>
          </div>
          <button
            onClick={() => setShowTranscriptModal(null)}
            className="p-1 px-2.5 hover:bg-red-50 text-slate-500 hover:text-[#ba1a1a] rounded font-bold text-xs transition-colors border border-slate-200 cursor-pointer"
          >
            Close Document
          </button>
        </div>

        {/* Sheet scroll area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100">
          <div className="bg-white shadow-xl mx-auto p-8 border-t-[16px] border-[#002045] min-h-[840px] w-full max-w-[210mm] text-slate-900 font-sans printable-sheet">
            <div className="border-4 border-double border-[#002045] p-6 h-full flex flex-col justify-between">

              <div>
                {/* Header */}
                <div className="flex items-center justify-center gap-4 relative mb-6">
                  <img src="/SVS LOGO NEW.png" className="w-20 h-20 object-contain absolute left-2" alt="Sanskar Logo" />
                  <div className="text-center w-full">
                    <h1 className="text-[20px] font-black text-[#002045] uppercase tracking-wide leading-tight font-sans">SANSKAR VIDHYAPITH SCHOOL</h1>
                    <p className="text-[12px] font-bold text-[#002045] tracking-wide mt-0.5 font-sans">Balkhu, Kathmandu</p>
                    <p className="text-[10px] font-semibold text-[#002045] tracking-wider mt-0.5 font-sans">Phone: 9802036680 | Email: sanskarvschool@gmail.com</p>
                  </div>
                </div>

                {/* Exam Title */}
                <div className="text-center my-4 space-y-1">
                  <h2 className="text-[11px] font-extrabold text-[#002045] uppercase tracking-widest font-sans">FINAL EXAMINATION</h2>
                  <h3 className="text-[14px] font-black text-[#002045] uppercase tracking-widest border-b border-[#002045] pb-1.5 inline-block px-8 font-sans">GRADE SHEET</h3>
                </div>

                {/* Student Info */}
                <div className="text-[10.5px] text-[#002045] font-semibold my-6 space-y-3 leading-relaxed font-sans">
                  <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
                    <span>THE GRADE(S) SECURED BY:</span>
                    <span className="border-b border-[#002045] px-2 font-black text-center grow max-w-[380px] uppercase">{showTranscriptModal.name}</span>
                    <span>ROLL NO:</span>
                    <span className="border-b border-[#002045] px-2 font-bold text-center w-12">{showTranscriptModal.rollNo}</span>
                    <span>GRADE:</span>
                    <span className="border-b border-[#002045] px-2 font-bold text-center w-24 uppercase">{showTranscriptModal.class}</span>
                  </div>
                  <div className="flex flex-wrap items-end gap-x-1 gap-y-2">
                    <span>IN THE FINAL EXAMINATION CONDUCTED IN</span>
                    <span className="border-b border-[#002045] px-2 font-bold text-center w-16">2082</span>
                    <span>B.S. (</span>
                    <span className="border-b border-[#002045] px-2 font-bold text-center w-16">2026</span>
                    <span>A.D.) ARE GIVEN BELOW.</span>
                  </div>
                </div>

                {/* Grades Table */}
                <table className="w-full text-[10.5px] border-collapse border border-[#002045] mb-4 font-sans">
                  <thead>
                    <tr className="bg-[#f0f4f8] text-[#002045]">
                      <th className="border border-[#002045] py-2 px-3 text-left font-bold w-[45%]">SUBJECTS</th>
                      <th className="border border-[#002045] py-2 px-2 text-center font-bold w-[20%]">GRADE POINT (GP)</th>
                      <th className="border border-[#002045] py-2 px-2 text-center font-bold w-[15%]">GRADE</th>
                      <th className="border border-[#002045] py-2 px-3 text-left font-bold w-[20%]">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedScoresList.map((scoreItem, sIdx) => (
                      <tr key={sIdx} className="text-[#002045]">
                        <td className="border border-[#002045] py-2 px-3 font-bold uppercase">{scoreItem.subject}</td>
                        <td className="border border-[#002045] py-2 px-2 text-center font-mono font-bold">{scoreItem.gp}</td>
                        <td className="border border-[#002045] py-2 px-2 text-center font-bold">{scoreItem.grade}</td>
                        <td className="border border-[#002045] py-2 px-3 font-semibold">{scoreItem.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* GPA and Rank */}
                <div className="border border-[#002045] bg-[#f0f4f8] py-2 px-4 flex justify-between items-center text-[10.5px] font-bold text-[#002045] mb-6 font-sans">
                  <span>Grade Point Average (GPA) = {gpa}</span>
                  <span>Rank = {rank}</span>
                </div>

                {/* Notes + Grade intervals */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[9px] text-[#002045] font-sans">
                  <div className="md:col-span-7 space-y-1.5">
                    <span className="font-bold text-[9.5px]">Note:</span>
                    <ol className="list-decimal pl-4 space-y-1 leading-normal font-medium">
                      <li>ABS: Absent</li>
                      <li>NG: Not Graded</li>
                      <li className="font-bold flex items-center gap-1 mt-0.5">
                        <span>GPA = </span>
                        <div className="inline-flex flex-col items-center text-[8px] leading-none align-middle font-normal">
                          <span className="border-b border-[#002045] pb-0.5 px-1">Σ(Total Obtained)*100</span>
                          <span className="pt-0.5">4 * No. of Learning Outcomes</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                  <div className="md:col-span-5">
                    <div className="text-center font-bold text-[#002045] mb-1.5 text-[9.5px]">Intervals and Grade</div>
                    <table className="w-full text-[8px] border-collapse border border-[#002045] text-center font-medium">
                      <thead>
                        <tr className="bg-[#f0f4f8] font-bold">
                          <th className="border border-[#002045] py-0.5 px-1">SN</th>
                          <th className="border border-[#002045] py-0.5 px-1">Interval In Percent</th>
                          <th className="border border-[#002045] py-0.5 px-1">Grade</th>
                          <th className="border border-[#002045] py-0.5 px-1">Grade Point</th>
                          <th className="border border-[#002045] py-0.5 px-1">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [1,'90 to 100','A+','4.0','Outstanding'],
                          [2,'80 to below 90','A','3.6','Excellent'],
                          [3,'70 to below 80','B+','3.2','Very Good'],
                          [4,'60 to below 70','B','2.8','Good'],
                          [5,'50 to below 60','C+','2.4','Satisfactory'],
                          [6,'40 to below 50','C','2.0','Acceptable'],
                          [7,'35 to below 40','D','1.6','Basic'],
                          [8,'0 to below 35','NG','-','Not Graded'],
                        ].map(([sn, interval, grade, gp, desc]) => (
                          <tr key={sn}>
                            <td className="border border-[#002045] py-0.5">{sn}</td>
                            <td className="border border-[#002045] py-0.5">{interval}</td>
                            <td className="border border-[#002045] py-0.5 font-bold">{grade}</td>
                            <td className="border border-[#002045] py-0.5 font-bold">{gp}</td>
                            <td className="border border-[#002045] py-0.5">{desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer signatures */}
              <div className="mt-10">
                <div className="flex justify-between items-end text-[#002045] font-sans">
                  <div className="text-center w-44">
                    <div className="border-t border-[#002045] pt-1 text-[9.5px] font-bold">CLASS TEACHER</div>
                  </div>
                  <div className="text-center w-44">
                    <div className="border-t border-[#002045] pt-1 text-[9.5px] font-bold">PRINCIPAL</div>
                  </div>
                </div>
                <div className="text-[9.5px] font-bold text-[#002045] mt-4 font-sans">
                  <span>DATE OF ISSUE: 2082-12-28</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 text-xs no-print">
          <button
            onClick={() => setShowTranscriptModal(null)}
            className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded cursor-pointer font-semibold"
          >
            Dismiss
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-slate-700 text-white hover:bg-slate-800 rounded font-bold shadow-sm cursor-pointer"
          >
            Print Grade Sheet
          </button>
          <PDFDownloadLink
            document={
              <GradeSheetPDF
                student={showTranscriptModal}
                mergedScoresList={mergedScoresList}
                gpa={gpa}
                rank={rank}
              />
            }
            fileName={`GradeSheet_${showTranscriptModal.name}_${showTranscriptModal.rollNo}.pdf`}
          >
            {({ loading }: { loading: boolean }) => (
              <button className="px-6 py-2 bg-[#002045] text-white hover:bg-opacity-90 rounded font-bold shadow-sm cursor-pointer">
                {loading ? 'Preparing...' : 'Download PDF'}
              </button>
            )}
          </PDFDownloadLink>
        </div>

      </motion.div>
    </div>
  );
}
