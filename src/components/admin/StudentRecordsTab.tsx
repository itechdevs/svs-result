'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Printer, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Student } from '@/types/academic';

interface StudentRecordsTabProps {
  students: Student[];
  gradingStudentId: string;
  setGradingStudentId: (id: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
  setShowTranscriptModal: (student: Student | null) => void;
  role: string;
}

export default function StudentRecordsTab({
  students,
  gradingStudentId,
  setGradingStudentId,
  setCurrentTab,
  setShowTranscriptModal,
  role,
}: StudentRecordsTabProps) {
  
  const activeGradingStudent = students.find(s => s.id === gradingStudentId) || students[0];
  const isAdmin = role === 'admin';

  return (
    <motion.div 
      key="student-records-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Student Academic Archives</h1>
          <p className="text-xs text-slate-500">Query and print detailed semester marks sheets and GPA transcript records.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setCurrentTab('result-compilation')}
            className="bg-[#002045] text-white hover:bg-opacity-90 font-bold py-2 px-5 rounded-lg shrink-0 text-xs shadow-sm cursor-pointer"
          >
            Results Center
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left directory column */}
        <div className="lg:col-span-4 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-border flex justify-between items-center text-xs font-bold text-[#002045] dark:text-white">
            <span>Student Directory</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border max-h-[550px] overflow-y-auto">
            {students.map((student) => (
              <button 
                key={student.id}
                onClick={() => setGradingStudentId(student.id)}
                className={cn(
                  "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center gap-3 outline-none cursor-pointer",
                  gradingStudentId === student.id && "bg-[#d6e3ff]/35 dark:bg-blue-950/20 border-r-4 border-[#002045]"
                )}
              >
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden border dark:border-border">
                  <img src={student.avatar} alt="stud" className="object-cover w-full h-full" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#002045] dark:text-white">{student.name}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{student.class}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* High Fidelity Performance Sheet Details Card */}
        <div className="lg:col-span-8 bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-2xl shadow-sm space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border dark:border-border relative shrink-0">
                <img src={activeGradingStudent.avatar} alt="stud" className="object-cover w-full h-full" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#002045] dark:text-white">{activeGradingStudent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">ID: {activeGradingStudent.id}</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                    activeGradingStudent.status === 'Active Enrollment' ? "bg-emerald-100 text-[#0a6c44] dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-100 text-[#ba1a1a] dark:bg-rose-950/40 dark:text-rose-350"
                  )}>
                    {activeGradingStudent.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin ? (
                <button 
                  onClick={() => setShowTranscriptModal(activeGradingStudent)}
                  className="px-4 py-2 border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Official Sheet Preview</span>
                </button>
              ) : (
                <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg text-slate-400 text-[10px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Report Cards restricted to Admin Role</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple student details widgets */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border dark:border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wider">Current Cycle Class</span>
              <p className="text-xs font-extrabold text-[#002045] dark:text-blue-300 mt-1">{activeGradingStudent.class}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border dark:border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wider">Attendance Rate</span>
              <p className="text-xs font-extrabold text-[#002045] dark:text-blue-300 mt-1">{activeGradingStudent.attendance}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border dark:border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wider">Assigned Department</span>
              <p className="text-xs font-extrabold text-[#002045] dark:text-blue-300 mt-1">{activeGradingStudent.department}</p>
            </div>
          </div>

          {/* Performances matrix items list */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#002045] dark:text-white uppercase tracking-wider">Subject Performance Matrix</h3>
            
            <div className="overflow-hidden border border-slate-200 dark:border-border rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold text-[10px] uppercase border-b dark:border-border">
                    <th className="p-3">Subject Name</th>
                    <th className="p-3">Assessment Context</th>
                    <th className="p-3 text-center">Score Ratio</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border text-slate-700 dark:text-slate-350">
                  {activeGradingStudent.scores.map((scoreItem, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-[#002045] dark:text-white">{scoreItem.subject}</td>
                      <td className="p-3 text-slate-500">{scoreItem.type}</td>
                      <td className="p-3 text-center font-mono font-bold">{scoreItem.obtained} / {scoreItem.max}</td>
                      <td className="p-3 text-right">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase",
                          scoreItem.pass ? "bg-emerald-100 text-[#0a6c44] dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-100 text-[#ba1a1a] dark:bg-rose-950/40 dark:text-rose-350"
                        )}>
                          {scoreItem.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom GPA analytics radial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-border">
            <div className="bg-[#1a365d] text-white p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest block">Aggregate standing</span>
                <h4 className="text-xl font-bold mt-1">Academic Success GPA</h4>
              </div>
              <div className="mt-8">
                <p className="text-3xl font-extrabold text-[#9ff5c1] tracking-tight">{activeGradingStudent.overallPercent}%</p>
                <p className="text-[11px] text-slate-300 mt-2">CGPA Equivalent Rating of {activeGradingStudent.overallTotal}</p>
              </div>
            </div>

            <div className="bg-[#9ff5c1]/10 border border-[#0a6c44]/20 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Result Decision</span>
                <h4 className="text-xl font-bold text-[#0a6c44] dark:text-emerald-400 mt-1 uppercase">{activeGradingStudent.resultStatus}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-6 leading-relaxed italic">&ldquo;{activeGradingStudent.remarks}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
