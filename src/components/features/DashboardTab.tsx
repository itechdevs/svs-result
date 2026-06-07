'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvaluationPlan, ReExam } from '@/types/academic';

interface DashboardTabProps {
  evaluations: EvaluationPlan[];
  reExams: ReExam[];
  setSelectedEvaluationId: (id: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
  setSchedulingReExam: (exam: ReExam | null) => void;
  setIsLockedSchedule: (locked: boolean) => void;
}

export default function DashboardTab({
  evaluations,
  reExams,
  setSelectedEvaluationId,
  setCurrentTab,
  setSchedulingReExam,
  setIsLockedSchedule,
}: DashboardTabProps) {
  return (
    <motion.div 
      key="dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#002045]">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Fall Semester 2023 - Department of Computer Science</p>
        </div>
      </div>

      {/* Bento Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stats card */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-[#002045]/40 transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Evaluations Plans</span>
            <div className="p-2 bg-blue-50 dark:bg-slate-800 text-[#002045] dark:text-blue-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#002045] dark:text-white tracking-tight">{evaluations.length}</span>
            <span className="text-xs font-medium text-slate-500 ml-2">Active Assessments</span>
          </div>
        </div>

        {/* Pending Re-Exams */}
        <div className="bg-[#ffdad6] dark:bg-red-950/20 border border-[#ba1a1a]/20 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#ba1a1a]/5 rounded-bl-full"></div>
          <div className="flex items-start justify-between relative z-10">
            <span className="text-xs font-bold text-[#ba1a1a] dark:text-red-400 uppercase tracking-wider">Pending Re-Exams</span>
            <div className="p-2 bg-[#ba1a1a] text-white rounded-xl shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-3xl font-extrabold text-[#ba1a1a] dark:text-red-400 tracking-tight">12</span>
            <span className="text-xs font-bold text-[#ba1a1a] dark:text-red-400 ml-2">Require Scheduling Action</span>
          </div>
        </div>

        {/* Class GPA */}
        <div className="bg-[#9ff5c1]/20 dark:bg-emerald-950/20 border border-[#0a6c44]/20 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-[#0a6c44]/40 transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Class GPA</span>
            <div className="p-2 bg-green-50 dark:bg-slate-800 text-[#0a6c44] dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-[#0a6c44] dark:text-emerald-400 tracking-tight">3.82</span>
            <span className="text-xs font-medium text-slate-500 ml-2">A+ Academic Standing</span>
          </div>
        </div>
      </div>

      {/* Dashboard Main Grid Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Evaluations Table */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="font-bold text-[#002045] dark:text-white text-sm">Recent Evaluations Plans</h2>
            <button 
              onClick={() => setCurrentTab('evaluations')}
              className="text-xs font-bold text-[#002045] dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-border">
                  <th className="px-6 py-4">Evaluation Title</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 text-center">Avg Weight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-border">
                {evaluations.slice(0, 4).map((evalPlan) => (
                  <tr key={evalPlan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/55 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#002045] dark:text-blue-300">{evalPlan.title}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        evalPlan.subject === 'Science' && "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
                        evalPlan.subject === 'Mathematics' && "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
                        evalPlan.subject === 'Literature' && "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
                        evalPlan.subject === 'Physics' && "bg-[#9ff5c1] dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                      )}>
                        {evalPlan.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-center">{evalPlan.fullMarks} Marks</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedEvaluationId(evalPlan.id);
                            setCurrentTab('mark-entry');
                          }}
                          className="p-1 px-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 font-bold text-[10px] rounded dark:text-white transition-colors cursor-pointer"
                        >
                          Enter Marks
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Re-Exam Action Alerts list */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-border flex justify-between items-center bg-red-50/50 dark:bg-red-950/10">
            <div className="flex items-center gap-2 text-[#ba1a1a] dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <h2 className="font-bold text-sm">Re-Exam Critical Alerts</h2>
            </div>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <p className="text-xs text-slate-500">Students requiring scheduling for recent fail indicators:</p>
            
            <div className="space-y-3">
              {reExams.map((candidate) => (
                <div 
                  key={candidate.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-border bg-slate-50 dark:bg-slate-900/50 hover:border-[#ba1a1a]/30 transition-colors"
                >
                  <div className="overflow-hidden mr-2">
                    <div className="font-bold text-xs text-[#002045] dark:text-blue-300 truncate">{candidate.name}</div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-1">
                      <span className={cn("w-2 h-2 rounded-full", candidate.status === 'SCHEDULED' ? "bg-emerald-500" : "bg-red-500 animate-pulse")}></span>
                      <span className="font-mono text-xs">{candidate.prevMarks}</span> ({candidate.subject})
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSchedulingReExam(candidate);
                      setIsLockedSchedule(candidate.status === 'SCHEDULED');
                      setCurrentTab('re-exam-portal');
                    }}
                    className={cn(
                      "text-[10px] font-bold py-1.5 px-3 rounded transition-colors cursor-pointer",
                      candidate.status === 'SCHEDULED' 
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-300"
                        : "bg-[#0b6c44] text-white hover:bg-opacity-95"
                    )}
                  >
                    {candidate.status === 'SCHEDULED' ? 'View Details' : 'Schedule'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <button 
              onClick={() => setCurrentTab('re-exam-portal')}
              className="text-xs font-bold text-[#002045] dark:text-blue-400 hover:underline cursor-pointer"
            >
              View System Portal →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
