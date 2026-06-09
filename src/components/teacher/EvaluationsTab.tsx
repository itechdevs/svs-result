'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvaluationPlan } from '@/types/academic';
import Link from 'next/link';

interface EvaluationsTabProps {
  evaluations: EvaluationPlan[];
  setSelectedEvaluationId: (id: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
  setNewEvalTitle: (title: string) => void;
  setNewEvalSubject: (subject: string) => void;
  newEvalSubject: string;
}

export default function EvaluationsTab({
  evaluations,
  setSelectedEvaluationId,
  setCurrentTab,
  setNewEvalTitle,
  setNewEvalSubject,
  newEvalSubject,
}: EvaluationsTabProps) {
  return (
    <motion.div
      key="evaluations-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#002045] dark:text-white">Academic Evaluations Plan</h2>
        </div>
        <Link
          href="/teacher/create-evaluation"
          className="bg-[#002045] text-white hover:bg-opacity-90 font-bold py-2 px-5 rounded-lg flex items-center gap-2 transform active:scale-95 transition-all text-xs shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Evaluation Plan</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-border shadow-sm">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Active Term Cycle</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#002045] dark:text-blue-300">02</span>
            <span className="text-xs text-emerald-600 font-bold">↑ Autumn Semester 1</span>
          </div>
        </div>
        <div className="border-l border-slate-200 dark:border-border pl-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Evaluations</p>
          <span className="text-2xl font-bold text-[#ba1a1a] dark:text-red-400 mt-1 block">
            {evaluations.length < 10 ? `0${evaluations.length}` : evaluations.length} Evaluations
          </span>
        </div>
      </div>

      {/* Evaluations Plan Cards Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evaluations.map((evalPlan) => (
          <div
            key={evalPlan.id}
            className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col"
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                    evalPlan.status === 'Active' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350"
                  )}>
                    {evalPlan.status}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono block">Created: {evalPlan.date}</span>
                </div>

                {/* Subject badge */}
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[#002045] dark:text-blue-300 rounded-full uppercase tracking-wider border dark:border-border">
                  {evalPlan.subject}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#002045] dark:text-white leading-snug line-clamp-1">{evalPlan.title}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Assessment Unit: {evalPlan.unit || "Core Modules"}</p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  value={newEvalSubject}
                  onChange={e => setNewEvalSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#002045] focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-border">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Task Types</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{evalPlan.testTypes}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Outcomes tracked</span>
                  <span className="font-bold text-xs text-[#002045] dark:text-blue-300 font-mono">{evalPlan.outcomes}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Max Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{evalPlan.fullMarks}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Pass Marks</span>
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 font-mono">{evalPlan.passMarks}</span>
                </div>
              </div>

              {/* Preview of what is inside */}
              {evalPlan.learningOutcomes && evalPlan.learningOutcomes.length > 0 && (
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5">Criteria Preview</span>
                  <ul className="text-[10px] text-slate-600 dark:text-slate-400 space-y-1">
                    {evalPlan.learningOutcomes.slice(0, 3).map((lo, idx) => (
                      <li key={idx} className="truncate flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#002045] dark:bg-blue-400 shrink-0" />
                        {lo.name}
                      </li>
                    ))}
                    {evalPlan.learningOutcomes.length > 3 && (
                      <li className="text-[9px] text-slate-400 italic mt-1 pl-2.5">
                        + {evalPlan.learningOutcomes.length - 3} more criteria
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-border/50 flex items-center gap-3">
              <Link
                href={`/teacher/edit-evaluation/${evalPlan.id}`}
                className="flex-1 bg-slate-100 dark:bg-slate-800 text-[#002045] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-bold py-2 rounded text-xs transition-all text-center"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  setSelectedEvaluationId(evalPlan.id);
                  setCurrentTab('mark-entry');
                }}
                className="flex-1 bg-[#002045] text-white hover:bg-opacity-95 font-bold py-2 rounded text-xs transition-all text-center cursor-pointer"
              >
                Enter Marks
              </button>
            </div>
          </div>
        ))}

        {/* Block Empty State Dashboard Placeholder */}
        <button
          onClick={() => setCurrentTab('create-evaluation')}
          className="border-2 border-dashed border-slate-300 dark:border-border rounded-xl flex flex-col items-center justify-center p-8 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors text-center group min-h-[300px] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-4 group-hover:scale-110 transition-transform shadow-inner border dark:border-border">
            <Plus className="w-6 h-6 text-[#002045] dark:text-[#9ff5c1]" />
          </div>
          <p className="font-bold text-sm text-[#002045] dark:text-white">Create New Evaluation Plan</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Catalog customized assessment rubrics for your department.</p>
        </button>
      </div>
    </motion.div>
  );
}
