'use client';

import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap } from 'lucide-react';
import { Student } from '@/types/academic';

interface TranscriptModalProps {
  showTranscriptModal: Student | null;
  setShowTranscriptModal: (student: Student | null) => void;
}

export default function TranscriptModal({
  showTranscriptModal,
  setShowTranscriptModal,
}: TranscriptModalProps) {
  
  if (!showTranscriptModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-slate-900">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dynamic Transcript Letterhead Sheet</span>
          </div>
          <button 
            onClick={() => setShowTranscriptModal(null)}
            className="p-1 px-2.5 hover:bg-red-50 text-slate-500 hover:text-[#ba1a1a] rounded font-bold text-xs transition-colors border border-slate-200 cursor-pointer"
          >
            Close Document
          </button>
        </div>

        {/* simulated physical sheet scroll space */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100">
          
          {/* Physical Sheet Outline */}
          <div className="bg-white shadow-xl mx-auto p-12 border-t-[16px] border-[#002045] min-h-[840px] w-full max-w-[210mm] text-slate-900 font-sans printable-sheet">
            
            {/* Header stamp */}
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#002045] rounded-xl flex items-center justify-center text-white">
                  <GraduationCap className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#002045] uppercase tracking-tight">EduGrade Academy</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Affiliated Board of State Examinations</p>
                  <p className="text-[10px] text-slate-400 italic">Faculty Admin Block, Level 4, Academic Way</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="font-extrabold text-[#002045] text-xs uppercase tracking-wider leading-none">Official Marksheet</h3>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">Session: Current Academic Year</p>
                <p className="text-[11px] text-[#002045] font-bold font-mono">TRANSCRIPT ID: #{showTranscriptModal.id}</p>
              </div>
            </div>

            {/* Profile data list */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
              <div className="space-y-2">
                <div className="flex gap-4">
                  <span className="text-slate-400 uppercase w-24 font-bold text-[9px] tracking-wider shrink-0">Student Name:</span>
                  <span className="font-extrabold text-[#002045] uppercase">{showTranscriptModal.name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-400 uppercase w-24 font-bold text-[9px] tracking-wider shrink-0">Roll Number:</span>
                  <span className="font-mono text-slate-700">{showTranscriptModal.rollNo}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-400 uppercase w-24 font-bold text-[9px] tracking-wider shrink-0">Department:</span>
                  <span className="text-slate-700 uppercase font-semibold">{showTranscriptModal.department}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <span className="text-slate-400 uppercase w-24 font-bold text-[9px] tracking-wider shrink-0">Assigned Class:</span>
                  <span className="text-slate-700 uppercase font-semibold">{showTranscriptModal.class}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-slate-400 uppercase w-24 font-bold text-[9px] tracking-wider shrink-0">Attendance Rate:</span>
                  <span className="text-slate-700 font-mono font-semibold">{showTranscriptModal.attendance}</span>
                </div>
              </div>
            </div>

            {/* Main scores list */}
            <table className="w-full text-xs text-left mb-10">
              <thead>
                <tr className="bg-slate-100/60 text-[#002045] border-y border-slate-200">
                  <th className="py-3 px-4 font-bold">Subject / Core Modules</th>
                  <th className="py-3 px-4 font-bold">Try context</th>
                  <th className="py-3 px-4 text-center font-bold">Evaluation Type</th>
                  <th className="py-3 px-4 text-center font-semibold">Marks Obtained</th>
                  <th className="py-3 px-4 text-right font-bold">Grade status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {showTranscriptModal.scores.map((scoreItem: any, sIdx: number) => (
                  <tr key={sIdx}>
                    <td className="py-3 px-4 font-bold text-[#002045]">{scoreItem.subject}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">Try 1</td>
                    <td className="py-3 px-4 text-center text-slate-500">{scoreItem.type}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-[#002045]">{scoreItem.obtained} / {scoreItem.max}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{scoreItem.pass ? 'Pass' : 'Probation'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* CGPA stamp and signature block */}
            <div className="flex justify-between items-end mt-12 border-t pt-8">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border rounded-lg inline-block text-xs">
                  <p className="font-bold text-[#002045]">CGPA Standing: {showTranscriptModal.overallPercent}%</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Aggregate Result: {showTranscriptModal.resultStatus}</p>
                </div>

                {/* QR verification */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-100 border flex items-center justify-center text-slate-400 border-slate-200 rounded shrink-0">
                    <span className="material-symbols-outlined text-[36px]">qr_code_2</span>
                  </div>
                  <p className="text-[9px] text-slate-400 max-w-[200px] leading-tight font-medium">Digital Verification Stamp. Scan QR code above to query and match with board registrar records.</p>
                </div>
              </div>

              <div className="text-center w-48 border-t border-slate-300 pt-2 shrink-0">
                <p className="text-[10px] font-bold text-[#002045]">Elena Vance</p>
                <p className="text-[9px] text-slate-400">Chief Registrar / Board Evaluator</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 text-xs">
          <button 
            onClick={() => setShowTranscriptModal(null)}
            className="px-5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-105 rounded cursor-pointer"
          >
            Dismiss
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-2 bg-[#002045] text-white hover:bg-opacity-95 rounded font-bold shadow-sm cursor-pointer"
          >
            Print Report Card
          </button>
        </div>

      </motion.div>
    </div>
  );
}
