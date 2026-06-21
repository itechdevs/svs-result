'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Student } from '@/types/academic';
import dynamic from 'next/dynamic';
import { buildMergedScores, computeGpa } from '@/lib/transcript-utils';

const TranscriptPDFContent = dynamic(
  () => import('@/components/shared/TranscriptPDFContent'),
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

export { buildMergedScores, computeGpa } from '@/lib/transcript-utils';

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
          {TranscriptPDFContent && (
            <TranscriptPDFContent
              student={showTranscriptModal}
              mergedScoresList={mergedScoresList}
              gpa={gpa}
              rank={rank}
            />
          )}
        </div>

      </motion.div>
    </div>
  );
}
