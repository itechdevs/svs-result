'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Student } from '@/types/academic';

interface TranscriptModalProps {
  showTranscriptModal: Student | null;
  setShowTranscriptModal: (student: Student | null) => void;
}

interface MergedScore {
  subject: string;
  obtained: number;
  max: number;
  percentage: number;
  grade: string;
  gp: number | string;
  remark: string;
}

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

export default function TranscriptModal({
  showTranscriptModal,
  setShowTranscriptModal,
}: TranscriptModalProps) {
  
  if (!showTranscriptModal) return null;

  // Process and merge scores
  const mergedScoresMap: Record<string, { obtained: number; max: number }> = {};
  showTranscriptModal.scores.forEach((scoreItem: any) => {
    const baseSubject = scoreItem.subject.replace(/\s*\((TH|IN|Theory|Internal|External)\)\s*$/i, '').trim();
    if (!mergedScoresMap[baseSubject]) {
      mergedScoresMap[baseSubject] = { obtained: 0, max: 0 };
    }
    mergedScoresMap[baseSubject].obtained += scoreItem.obtained;
    mergedScoresMap[baseSubject].max += scoreItem.max;
  });

  const mergedScoresList: MergedScore[] = Object.entries(mergedScoresMap).map(([subject, data]) => {
    const percentage = data.max > 0 ? (data.obtained / data.max) * 100 : 0;
    const gradeDetails = getGradeDetails(percentage);
    return {
      subject,
      obtained: data.obtained,
      max: data.max,
      percentage,
      grade: gradeDetails.grade,
      gp: gradeDetails.grade === 'NG' ? '-' : gradeDetails.gp.toFixed(1),
      remark: gradeDetails.remark
    };
  });

  // Calculate GPA
  const validGps = mergedScoresList
    .map(s => typeof s.gp === 'number' ? s.gp : parseFloat(s.gp as string))
    .filter(gp => !isNaN(gp));
  const gpa = validGps.length > 0 ? (validGps.reduce((sum, gp) => sum + gp, 0) / validGps.length).toFixed(2) : '0.00';

  // Get Rank
  const rank = (showTranscriptModal as any).rank || (showTranscriptModal as any).classRank || 3;

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

        {/* Simulated physical sheet scroll space */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100">
          
          {/* Physical Sheet Outline with double border */}
          <div className="bg-white shadow-xl mx-auto p-8 border-t-[16px] border-[#002045] min-h-[840px] w-full max-w-[210mm] text-slate-900 font-sans printable-sheet">
            <div className="border-4 border-double border-[#002045] p-6 h-full flex flex-col justify-between">
              
              <div>
                {/* Header Section */}
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

                {/* Student Info Details */}
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

                {/* Main Grades Table */}
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

                {/* GPA and Rank Bar */}
                <div className="border border-[#002045] bg-[#f0f4f8] py-2 px-4 flex justify-between items-center text-[10.5px] font-bold text-[#002045] mb-6 font-sans">
                  <span>Grade Point Average (GPA) = {gpa}</span>
                  <span>Rank = {rank}</span>
                </div>

                {/* Notes and Intervals and Grade section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-[9px] text-[#002045] font-sans">
                  {/* Left Column: Note */}
                  <div className="md:col-span-7 space-y-1.5">
                    <span className="font-bold text-[9.5px]">Note:</span>
                    <ol className="list-decimal pl-4 space-y-1 leading-normal font-medium">
                      <li>One Credit Hour Equals To 32 Working Hours.</li>
                      <li>INTERNAL(IN): This Covers The Participation, Practical/Project Works & Terminal Examination.</li>
                      <li>EXTERNAL(TH): This Covers Written External Examination.</li>
                      <li>ABS: Absent</li>
                      <li>NG: Not Graded</li>
                      <li className="font-bold flex items-center gap-1 mt-0.5">
                        <span>GPA = </span>
                        <div className="inline-flex flex-col items-center text-[8px] leading-none align-middle font-normal">
                          <span className="border-b border-[#002045] pb-0.5 px-1">Σ(Credit Hour * Grade Point)</span>
                          <span className="pt-0.5">Total Credit Hour of the Grade</span>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Right Column: Intervals and Grade */}
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
                        <tr>
                          <td className="border border-[#002045] py-0.5">1</td>
                          <td className="border border-[#002045] py-0.5">90 to 100</td>
                          <td className="border border-[#002045] py-0.5 font-bold">A+</td>
                          <td className="border border-[#002045] py-0.5 font-bold">4.0</td>
                          <td className="border border-[#002045] py-0.5">Outstanding</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">2</td>
                          <td className="border border-[#002045] py-0.5">80 to below 90</td>
                          <td className="border border-[#002045] py-0.5 font-bold">A</td>
                          <td className="border border-[#002045] py-0.5 font-bold">3.6</td>
                          <td className="border border-[#002045] py-0.5">Excellent</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">3</td>
                          <td className="border border-[#002045] py-0.5">70 to below 80</td>
                          <td className="border border-[#002045] py-0.5 font-bold">B+</td>
                          <td className="border border-[#002045] py-0.5 font-bold">3.2</td>
                          <td className="border border-[#002045] py-0.5">Very Good</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">4</td>
                          <td className="border border-[#002045] py-0.5">60 to below 70</td>
                          <td className="border border-[#002045] py-0.5 font-bold">B</td>
                          <td className="border border-[#002045] py-0.5 font-bold">2.8</td>
                          <td className="border border-[#002045] py-0.5">Good</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">5</td>
                          <td className="border border-[#002045] py-0.5">50 to below 60</td>
                          <td className="border border-[#002045] py-0.5 font-bold">C+</td>
                          <td className="border border-[#002045] py-0.5 font-bold">2.4</td>
                          <td className="border border-[#002045] py-0.5">Satisfactory</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">6</td>
                          <td className="border border-[#002045] py-0.5">40 to below 50</td>
                          <td className="border border-[#002045] py-0.5 font-bold">C</td>
                          <td className="border border-[#002045] py-0.5 font-bold">2.0</td>
                          <td className="border border-[#002045] py-0.5">Acceptable</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">7</td>
                          <td className="border border-[#002045] py-0.5">35 to below 40</td>
                          <td className="border border-[#002045] py-0.5 font-bold">D</td>
                          <td className="border border-[#002045] py-0.5 font-bold">1.6</td>
                          <td className="border border-[#002045] py-0.5">Basic</td>
                        </tr>
                        <tr>
                          <td className="border border-[#002045] py-0.5">8</td>
                          <td className="border border-[#002045] py-0.5">0 to below 35</td>
                          <td className="border border-[#002045] py-0.5 font-bold">NG</td>
                          <td className="border border-[#002045] py-0.5 font-bold">-</td>
                          <td className="border border-[#002045] py-0.5">Not Graded</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer / Signatures Block */}
              <div className="mt-10">
                <div className="flex justify-between items-end text-[#002045] font-sans">
                  <div className="text-center w-44">
                    <div className="border-t border-[#002045] pt-1 text-[9.5px] font-bold">CLASS TEACHER</div>
                  </div>
                  <div className="text-center w-44">
                    <div className="border-t border-[#002045] pt-1 text-[9.5px] font-bold">PRINCIPAL</div>
                  </div>
                </div>
                <div className="text-[9.5px] font-bold text-[#002045] mt-4 font-sans flex justify-between items-center">
                  <span>DATE OF ISSUE: 2082-12-28</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Modal footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 text-xs">
          <button 
            onClick={() => setShowTranscriptModal(null)}
            className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded cursor-pointer font-semibold"
          >
            Dismiss
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-[#002045] text-white hover:bg-opacity-95 rounded font-bold shadow-sm cursor-pointer"
          >
            Print Grade Sheet
          </button>
        </div>

      </motion.div>
    </div>
  );
}
