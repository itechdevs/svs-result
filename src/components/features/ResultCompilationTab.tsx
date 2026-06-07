'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, CheckCircle, RefreshCw } from 'lucide-react';

interface ResultCompilationTabProps {
  onCompilationComplete?: () => void;
}

export default function ResultCompilationTab({ onCompilationComplete }: ResultCompilationTabProps) {
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledSession, setCompiledSession] = useState<string | null>(null);

  const startCompilationProgress = (sessionName: string) => {
    setIsCompiling(true);
    setCompilationProgress(0);
    const interval = setInterval(() => {
      setCompilationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompiling(false);
          setCompiledSession(sessionName);
          if (onCompilationComplete) onCompilationComplete();
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 5;
      });
    }, 200);
  };

  return (
    <motion.div 
      key="result-compilation"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Result Sessions &amp; Compilation</h1>
          <p className="text-xs text-slate-500">Aggregate submark sets, configure curriculum weights, and generate official student records.</p>
        </div>
      </div>

      {/* Session directory selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-card border-2 border-[#0b6c44] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 bg-[#0b6c44] text-white px-3 py-1 rounded-bl-lg text-[9px] font-bold">ACTIVE TERM</div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-slate-900 text-[#0b6c44] dark:text-[#9ff5c1] flex items-center justify-center rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">AY 2023-2024</p>
              <h4 className="font-bold text-sm text-[#002045] dark:text-blue-300">First Terminal Exam</h4>
            </div>
          </div>
          <button 
            onClick={() => startCompilationProgress('First Terminal Exam')}
            className="mt-2 w-full py-2 bg-[#0b6c44]/10 text-[#0b6c44] border border-[#0b6c44]/20 rounded text-[10px] font-bold hover:bg-[#0b6c44] hover:text-white transition-all text-center cursor-pointer"
          >
            SELECT FOR COMPILATION
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl flex flex-col gap-4 group hover:border-[#002045]/30 transition-all opacity-85">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-[#002045] dark:text-blue-300 flex items-center justify-center rounded-lg border dark:border-border">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">AY 2023-2024</p>
              <h4 className="font-bold text-sm text-[#002045] dark:text-blue-300">Mid-Term Assessment</h4>
            </div>
          </div>
          <button className="mt-2 w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 border dark:border-border rounded text-[10px] font-bold cursor-not-allowed text-center">
            RESULTS FINALIZED
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl flex flex-col gap-4 opacity-75">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center rounded-lg border border-dashed dark:border-border">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">AY 2023-2024</p>
              <h4 className="font-bold text-sm text-slate-400">Final Semester</h4>
            </div>
          </div>
          <p className="text-[11px] italic text-slate-400">Scheduled for early Autumn. Evaluations criteria pending board approval.</p>
        </div>
      </div>

      {/* Compilation controller panel */}
      {isCompiling || compiledSession ? (
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#1a365d] p-6 flex justify-between items-center text-white">
            <div>
              <h3 className="font-bold text-sm">Result Compilation Workspace</h3>
              <p className="text-[11px] text-slate-300">Targeting Term session: <span className="font-bold text-[#9ff5c1]">First Terminal Exam</span></p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Included modules checks */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#002045] dark:text-white text-xs uppercase tracking-wider">Module weighting setup</h4>
                
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border dark:border-border space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#002045]" />
                    <div className="flex-grow flex justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>Reading Proficiency &amp; Writing</span>
                      <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 rounded font-bold">40% Weight</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#002045]" />
                    <div className="flex-grow flex justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>Mathematics (Linear &amp; Graphs)</span>
                      <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 rounded font-bold">45% Weight</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-[#002045]" />
                    <div className="flex-grow flex justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>Physics Subatomic Lab Checks</span>
                      <span className="font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 rounded font-bold">15% Weight</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Calculations logic */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#002045] dark:text-white text-xs uppercase tracking-wider">Aggregation Parameters</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Calculation Method Option</label>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-border p-2.5 rounded-lg text-xs font-semibold focus:outline-none text-slate-900 dark:text-white">
                      <option>Weighted Cumulative Average (District Policy 2023)</option>
                      <option>Simple Mathematical Mean</option>
                    </select>
                  </div>
                  
                  {/* Loader simulation */}
                  {isCompiling && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>GRADING DATA PIPELINE COMPILES...</span>
                        <span>{compilationProgress}% COMPLETE</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#0b6c44] h-full transition-all duration-300" style={{ width: `${compilationProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {compiledSession && !isCompiling && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-350 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#0a6c44] dark:text-[#9ff5c1]">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>Compilation completed successfully!</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">Calculated GPA models for 124 students committed. View finalized records in Student Records.</p>
                    </div>
                  )}

                  <button 
                    disabled={isCompiling}
                    onClick={() => startCompilationProgress('First Terminal Exam')}
                    className="w-full bg-[#002045] text-white hover:bg-opacity-95 font-bold py-3 px-5 rounded-lg active:scale-95 transition-all text-xs text-center cursor-pointer"
                  >
                    COMPILE RESULTS NOW
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-border rounded-2xl flex flex-col items-center justify-center p-12 text-center h-[300px]">
          <CheckCircle className="w-8 h-8 text-slate-400 mb-2" />
          <p className="font-bold text-[#002045] dark:text-white">Compile Pipeline Dormant</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Select an active result session above (First Terminal) to bootstrap system aggregates.</p>
        </div>
      )}
    </motion.div>
  );
}
