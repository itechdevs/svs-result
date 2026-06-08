'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { EvaluationPlan, Student } from '@/types/academic';

interface MarkEntryTabProps {
  evaluations: EvaluationPlan[];
  students: Student[];
  selectedEvaluationId: string;
  setSelectedEvaluationId: (id: string) => void;
  gradingStudentId: string;
  setGradingStudentId: (id: string) => void;
  saveSuccessMessage: boolean;
  setSaveSuccessMessage: (val: boolean) => void;
  updateIndividualRating: (outcomeName: string, value: number, isSupport: boolean) => void;
}

export default function MarkEntryTab({
  evaluations,
  students,
  selectedEvaluationId,
  setSelectedEvaluationId,
  gradingStudentId,
  setGradingStudentId,
  saveSuccessMessage,
  setSaveSuccessMessage,
  updateIndividualRating,
}: MarkEntryTabProps) {
  
  const activeEval = evaluations.find(e => e.id === selectedEvaluationId) || evaluations[0];

  // Sum up marks in mark entry
  const entryTotalRatings = activeEval.learningOutcomes.reduce((acc, curr) => acc + (curr.regularRating || 0), 0);
  const entryMaxPossible = activeEval.learningOutcomes.length * 4;
  const entryPercentage = ((entryTotalRatings / (entryMaxPossible || 1)) * 100).toFixed(2);

  const handleSave = () => {
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 2500);
  };

  return (
    <motion.div 
      key="mark-entry-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-border shadow-sm">
        <div className="flex-1 w-full max-w-xl">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Selector</label>
          <div className="flex gap-3 mt-1.5">
            <select 
              value={selectedEvaluationId}
              onChange={e => setSelectedEvaluationId(e.target.value)}
              className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-xl font-bold text-xs text-[#002045] dark:text-white focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            >
              {evaluations.map(e => (
                <option key={e.id} value={e.id}>{e.title} ({e.subject})</option>
              ))}
            </select>
            
            <select 
              value={gradingStudentId}
              onChange={e => setGradingStudentId(e.target.value)}
              className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-xl font-bold text-xs text-[#002045] dark:text-white focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm transform active:scale-95 transition-all text-center cursor-pointer"
          >
            Save &amp; Continue
          </button>
        </div>
      </div>

      {saveSuccessMessage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-between"
        >
          <span>Academic records synchronized successfully with system databases.</span>
          <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
        </motion.div>
      )}

      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-extrabold text-[#002045] dark:text-white text-sm">Outcomes Rating Worksheet — {activeEval.title}</h3>
          <p className="text-[11px] text-slate-500 mt-1">Grade regular levels (1 to 4) carefully based on class assessments.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-200 dark:border-border">
                <th className="px-6 py-4 w-12 text-center">S.N.</th>
                <th className="px-6 py-4 w-40">LANGUAGE SKILL / OUTCOME</th>
                <th className="px-6 py-4">DESCRIPTOR VALUE LISTS</th>
                <th className="px-6 py-4 text-center">REGULAR GRADE</th>
                <th className="px-6 py-4 text-center">SUPPORT GRADE</th>
                <th className="px-6 py-4">REMARKS</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 dark:text-slate-350 divide-y divide-slate-100 dark:divide-border">
              {activeEval.learningOutcomes.map((lo, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 text-center font-mono">{index + 1}</td>
                  <td className="px-6 py-4 font-bold text-indigo-700 dark:text-indigo-400">{lo.name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 leading-snug">{lo.text}</td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="number" 
                      min={1} 
                      max={4}
                      value={lo.regularRating || 1}
                      onChange={e => updateIndividualRating(lo.name, Math.min(4, Math.max(1, Number(e.target.value))), false)}
                      className="w-12 h-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded text-center text-xs font-bold text-indigo-900 dark:text-indigo-200 focus:outline-none"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="number" 
                      min={1} 
                      max={4}
                      value={lo.afterSupportRating || ''}
                      placeholder="--"
                      onChange={e => updateIndividualRating(lo.name, Math.min(4, Math.max(1, Number(e.target.value))), true)}
                      className="w-12 h-10 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded text-center text-xs font-bold text-emerald-900 dark:text-emerald-200 focus:outline-none placeholder-slate-400"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text"
                      placeholder="..." 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded px-2 py-1 text-[11px] text-slate-950 dark:text-white" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations sticky footer simulation */}
        <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-800">
          <div className="flex gap-8">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Obtained Ratings</p>
              <p className="text-xl font-bold text-emerald-400">{entryTotalRatings} <span className="text-slate-400 text-xs">/ {entryMaxPossible}</span></p>
            </div>
            <div className="border-l border-white/10 pl-6">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score Percentage</p>
              <p className="text-xl font-bold text-[#9ff5c1] font-mono">{entryPercentage} %</p>
            </div>
            <div className="border-l border-white/10 pl-6 hidden lg:block max-w-sm">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outcome Formula</p>
              <code className="text-[10px] text-slate-350 font-mono bg-white/5 px-2 py-1 rounded">Achieved % = (Total / Max possible) * 100</code>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSave}
              className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all text-center cursor-pointer"
            >
              Commit Grades
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
