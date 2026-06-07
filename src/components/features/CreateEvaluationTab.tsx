'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

interface OutcomeRow {
  name: string;
  date: string;
  max: number;
  pass: number;
}

interface CreateEvaluationTabProps {
  newEvalTitle: string;
  setNewEvalTitle: (val: string) => void;
  newEvalSubject: string;
  setNewEvalSubject: (val: string) => void;
  targetMarks: number;
  setTargetMarks: (val: number) => void;
  newOutcomes: OutcomeRow[];
  setNewOutcomes: React.Dispatch<React.SetStateAction<OutcomeRow[]>>;
  handleCreateEvaluation: () => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
}

export default function CreateEvaluationTab({
  newEvalTitle,
  setNewEvalTitle,
  newEvalSubject,
  setNewEvalSubject,
  targetMarks,
  setTargetMarks,
  newOutcomes,
  setNewOutcomes,
  handleCreateEvaluation,
  setCurrentTab,
}: CreateEvaluationTabProps) {
  
  const addNewOutcomeRow = () => {
    setNewOutcomes([...newOutcomes, { name: 'New Specific Area', date: '2024-05-25', max: 20, pass: 8 }]);
  };

  const deleteOutcomeRow = (idx: number) => {
    setNewOutcomes(newOutcomes.filter((_, i) => i !== idx));
  };

  const calculatedSum = newOutcomes.reduce((acc, curr) => acc + Number(curr.max), 0);

  return (
    <motion.div 
      key="create-evaluation-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-border justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentTab('evaluations')}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center border border-slate-200 dark:border-border cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#002045] dark:text-blue-300" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-[#ba1a1a] dark:text-red-400 uppercase bg-[#ffdad6] dark:bg-red-950/40 px-2 py-0.5 rounded">Setup Mode</span>
            <h2 className="font-bold text-sm text-[#002045] dark:text-white mt-0.5">Create New Evaluation Rubric</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleCreateEvaluation}
            className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2 px-5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            Save Evaluation Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Basic Metadata Info */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white tracking-wider uppercase border-b dark:border-border pb-2">Rubric Definition</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Evaluation Title</label>
              <input 
                type="text" 
                value={newEvalTitle}
                onChange={e => setNewEvalTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#002045] focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Assigned Subject</label>
              <select 
                value={newEvalSubject}
                onChange={e => setNewEvalSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#002045] focus:outline-none text-slate-900 dark:text-white"
              >
                <option value="Science">General Science</option>
                <option value="Mathematics">Advanced Mathematics</option>
                <option value="Literature">Classical Literature</option>
                <option value="Physics">Quantum Physics</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Target Pass Total Marks</label>
              <input 
                type="number" 
                value={targetMarks}
                onChange={e => setTargetMarks(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#002045] focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Calculations checklist */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-bold text-xs text-[#ba1a1a] dark:text-red-400 tracking-wider uppercase border-b dark:border-border pb-2">Plan Validation</h3>
            <p className="text-xs text-slate-500 mt-2">All custom sub-learning outcome marks are aggregated instantly below.</p>
            
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border dark:border-border space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Calculated Marks Sum:</span>
                <span className="font-mono text-slate-900 dark:text-white">{calculatedSum} Marks</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-300">Required Target Marks:</span>
                <span className="font-mono text-slate-900 dark:text-white">{targetMarks} Marks</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            {calculatedSum === targetMarks ? (
              <div className="text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>Validation passed! Scores tally perfectly.</span>
              </div>
            ) : (
              <div className="text-[#ba1a1a] dark:text-red-400 text-xs font-semibold flex items-start gap-1">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Caution: Aggregated submarks sum does not match target PASS value.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Outcomes Array Entries List */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-border flex justify-between items-center">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Sub-Evaluation Criteria Outlines</h3>
          <button 
            onClick={addNewOutcomeRow}
            className="text-xs font-bold text-[#0b6c44] dark:text-[#9ff5c1] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Learning Area Row</span>
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 font-bold text-slate-500 text-[10px] uppercase border-b dark:border-border pb-2 px-2">
              <div className="col-span-5">Sub Learning outcome criteria</div>
              <div className="col-span-3">Assessment Date</div>
              <div className="col-span-2 text-center">Max Marks</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            {newOutcomes.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-border">
                <div className="col-span-5">
                  <input 
                    type="text" 
                    value={item.name}
                    onChange={e => {
                      const copy = [...newOutcomes];
                      copy[idx].name = e.target.value;
                      setNewOutcomes(copy);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="date" 
                    value={item.date}
                    onChange={e => {
                      const copy = [...newOutcomes];
                      copy[idx].date = e.target.value;
                      setNewOutcomes(copy);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    value={item.max}
                    onChange={e => {
                      const copy = [...newOutcomes];
                      copy[idx].max = Number(e.target.value);
                      setNewOutcomes(copy);
                    }}
                    className="w-20 mx-auto text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                  />
                </div>
                <div className="col-span-2 text-center">
                  <button 
                    onClick={() => deleteOutcomeRow(idx)}
                    className="p-1 px-3 text-xs font-bold text-[#ba1a1a] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
