'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Download, AlertCircle, Clock, CalendarCheck, ChevronRight, RefreshCw, CheckCircle2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReExam } from '@/types/academic';

interface ReExamPortalTabProps {
  reExams: ReExam[];
  schedulingReExam: ReExam | null;
  setSchedulingReExam: (exam: ReExam | null) => void;
  reExamDate: string;
  setReExamDate: (val: string) => void;
  reExamTime: string;
  setReExamTime: (val: string) => void;
  isLockedSchedule: boolean;
  setIsLockedSchedule: (val: boolean) => void;
  saveSuccessMessage: boolean;
  setSaveSuccessMessage: (val: boolean) => void;
  isSavingReExam: boolean;
  setIsSavingReExam: (val: boolean) => void;
}

export default function ReExamPortalTab({
  reExams,
  schedulingReExam,
  setSchedulingReExam,
  reExamDate,
  setReExamDate,
  reExamTime,
  setReExamTime,
  isLockedSchedule,
  setIsLockedSchedule,
  saveSuccessMessage,
  setSaveSuccessMessage,
  isSavingReExam,
  setIsSavingReExam,
}: ReExamPortalTabProps) {
  
  const handleRecalculate = () => {
    setIsSavingReExam(true);
    setTimeout(() => {
      setIsSavingReExam(false);
      setSaveSuccessMessage(true);
      setTimeout(() => setSaveSuccessMessage(false), 2000);
    }, 1500);
  };

  return (
    <motion.div 
      key="re-exam-portal-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Re-Examination Management</h1>
          <p className="text-xs text-slate-500">Coordinate and score supplemental sessions for failed learning outcome targets.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 flex items-center gap-1.5 border border-slate-200 dark:border-border text-slate-700 dark:text-slate-350 bg-white dark:bg-card rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-semibold cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 dark:bg-red-950/20 border border-[#ba1a1a]/10 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900 text-[#ba1a1a] dark:text-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Unscheduled</p>
            <h4 className="text-2xl font-extrabold text-[#ba1a1a] dark:text-red-400 mt-1">12 Candidates</h4>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Grading</p>
            <h4 className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 mt-1">87 Pending</h4>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Scheduled Today</p>
            <h4 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">12 Scheduled</h4>
          </div>
        </div>
      </div>

      {/* Split list and scheduling preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Candidates Directory list */}
        <div className="lg:col-span-4 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Candidate Registry</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border max-h-[500px] overflow-y-auto">
            {reExams.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  setSchedulingReExam(item);
                  setIsLockedSchedule(item.status === 'SCHEDULED');
                }}
                className={cn(
                  "w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between outline-none cursor-pointer",
                  schedulingReExam?.id === item.id && "bg-slate-50 dark:bg-slate-800 border-r-4 border-[#0b6c44]"
                )}
              >
                <div>
                  <div className="font-bold text-xs text-[#002045] dark:text-white">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 shrink-0">{item.roll}</div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold mt-1">Failed outcomes: {item.subject}</div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Scheduling / Compare Portal Wizard pane */}
        <div className="lg:col-span-8 space-y-6">
          {schedulingReExam ? (
            <div className="bg-white dark:bg-card border border-[#0b6c44]/20 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div className="flex justify-between items-start border-b dark:border-border pb-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Schedule Block</span>
                  <h2 className="text-base font-extrabold text-[#002045] dark:text-white mt-1">Supplemental Workspace : {schedulingReExam.name}</h2>
                </div>
                <span className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                  schedulingReExam.status === 'SCHEDULED' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-350"
                )}>
                  {schedulingReExam.status}
                </span>
              </div>

              {/* Interactive Scheduler Card Fields */}
              <div className="bg-slate-50 dark:bg-slate-900 border dark:border-border p-5 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-[#002045] dark:text-white uppercase tracking-wider leading-none">Supplementary Exam Scheduler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Session Date</label>
                    <input 
                      type="date" 
                      value={reExamDate}
                      disabled={isLockedSchedule}
                      onChange={e => setReExamDate(e.target.value)}
                      className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded-lg p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={reExamTime}
                      disabled={isLockedSchedule}
                      onChange={e => setReExamTime(e.target.value)}
                      className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded-lg p-2.5 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <button 
                      onClick={() => setIsLockedSchedule(!isLockedSchedule)}
                      className={cn(
                        "w-full text-xs font-bold py-2.5 rounded-lg border transition-all text-center cursor-pointer",
                        isLockedSchedule 
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 border-slate-300"
                          : "bg-[#9ff5c1] text-[#001c2e] hover:bg-opacity-95 border-emerald-300"
                      )}
                    >
                      {isLockedSchedule ? 'Lock Schedule' : 'Schedule session'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Mark entry compare panel */}
              <div className="space-y-4 pt-4 border-t dark:border-border">
                <h3 className="text-xs font-bold text-[#002045] dark:text-white uppercase tracking-wider">Outcome Entry &amp; Comparison</h3>
                
                <div className="overflow-hidden border border-slate-200 dark:border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1a365d] text-white">
                      <tr>
                        <th className="p-3 w-1/2">Sub-Learning Outcome</th>
                        <th className="p-3 text-center">Weight</th>
                        <th className="p-3 text-center">Previous Try</th>
                        <th className="p-3 text-center bg-emerald-800">New Re-Exam Mark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-border text-slate-700 dark:text-slate-300">
                      {schedulingReExam.learningOutcomes.map((lo: any, lidx: number) => (
                        <tr key={lidx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <p className="font-bold text-[#002045] dark:text-white">{lo.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{lo.desc}</p>
                          </td>
                          <td className="p-3 text-center font-mono">{lo.weight}</td>
                          <td className="p-3 text-center text-[#ba1a1a] dark:text-red-400 font-bold font-mono">{lo.original}</td>
                          <td className="p-3 bg-emerald-50 dark:bg-emerald-950/20 flex justify-center">
                            <input 
                              type="number"
                              value={lo.current}
                              onChange={(e) => {
                                const copy = { ...schedulingReExam };
                                copy.learningOutcomes[lidx].current = Number(e.target.value);
                                setSchedulingReExam(copy);
                              }}
                              className="w-16 h-8 text-center bg-white dark:bg-slate-800 border dark:border-border rounded text-xs font-bold text-[#0b6c44] dark:text-emerald-450 font-mono focus:ring-1 focus:ring-[#0b6c44]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recalculate button trigger simulated loading animation */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-border">
                <div className="text-xs text-slate-400">Projected: <span className="font-bold text-[#0a6c44]">PASS (A-) after GPA calculation</span></div>
                <button 
                  disabled={isSavingReExam}
                  onClick={handleRecalculate}
                  className="bg-[#002045] text-white hover:bg-opacity-95 font-bold py-2 px-5 rounded-lg active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSavingReExam ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Save &amp; Recalculate GPA</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-border rounded-2xl flex flex-col items-center justify-center p-12 text-center h-[400px]">
              <User className="w-8 h-8 text-slate-400 mb-2" />
              <p className="font-bold text-[#002045] dark:text-white">No Candidate Workspace Active</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Select a failed candidate profile from directory left to configure settings.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
