'use client';

import React, { useState } from 'react';
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
  const currentStudent = students.find(s => s.id === gradingStudentId) || students[0];

  // Calculate total marks and status
  const studentTotalMarks = activeEval.learningOutcomes.reduce((sum, lo) => sum + (lo.regularRating || 0), 0);
  const studentPercentage = (studentTotalMarks / activeEval.fullMarks) * 100;

  const handleSave = () => {
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 2500);
  };

  const handlePrevStudent = () => {
    const currentIndex = students.findIndex(s => s.id === gradingStudentId);
    if (currentIndex > 0) setGradingStudentId(students[currentIndex - 1].id);
  };

  const handleNextStudent = () => {
    const currentIndex = students.findIndex(s => s.id === gradingStudentId);
    if (currentIndex < students.length - 1) setGradingStudentId(students[currentIndex + 1].id);
  };

  return (
    <motion.div
      key="mark-entry-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Student Navigation Bar */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Student Selection
            </label>
            <select
              value={gradingStudentId}
              onChange={e => setGradingStudentId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-lg font-medium text-sm text-[#002045] dark:text-white focus:ring-2 focus:ring-[#002045] focus:outline-none cursor-pointer"
            >
              {students.map((s, index) => (
                <option key={s.id} value={s.id}>
                  {`${String(index + 1).padStart(2, '0')}. ${s.name}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-border"
              onClick={handlePrevStudent}
            >
              ←
            </button>
            <button 
              className="px-4 py-2 text-sm font-semibold text-[#002045] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-border"
              onClick={handleNextStudent}
            >
              Next →
            </button>
          </div>

          <button className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-border flex items-center gap-2">
            <span>📄</span> Export
          </button>
        </div>
      </div>

      {/* Unit Title and Assessment Date */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Unit Title
            </label>
            <input
              type="text"
              value={`${activeEval.unit || activeEval.title}`}
              readOnly
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-lg text-sm text-[#002045] dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Assessment Date
            </label>
            <input
              type="text"
              value={activeEval.date}
              readOnly
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-lg text-sm text-[#002045] dark:text-white font-medium"
            />
          </div>
        </div>
      </div>

      {/* Learning Outcomes Table */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border text-center w-16">
                  S.N.
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border w-40">
                  Language Skills
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-r border-slate-200 dark:border-border">
                  Learning Outcome Indicators
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-emerald-50 dark:bg-emerald-950/20" colSpan={2}>
                  Regular Class Assessment
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-center border-r border-slate-200 dark:border-border bg-purple-50 dark:bg-purple-950/20" colSpan={2}>
                  Assessment After Support
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
              <tr className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-border">
                <th className="px-4 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase"></th>
                <th className="px-4 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase"></th>
                <th className="px-4 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase"></th>
                <th className="px-2 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase text-center border-r border-slate-200 dark:border-border">Date</th>
                <th className="px-2 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase text-center border-r border-slate-200 dark:border-border">Rating</th>
                <th className="px-2 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase text-center border-r border-slate-200 dark:border-border">Date</th>
                <th className="px-2 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase text-center border-r border-slate-200 dark:border-border">Rating</th>
                <th className="px-4 py-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-border">
              {activeEval.learningOutcomes.map((lo, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4 text-center font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-border">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 font-semibold text-sm text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-border">
                    {lo.name}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-r border-slate-200 dark:border-border">
                    {lo.text}
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                    <input
                      type="date"
                      value={lo.regularDate || ''}
                      className="w-28 px-2 py-1.5 text-xs text-center border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    />
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={lo.regularRating || ''}
                      onChange={e => updateIndividualRating(lo.name, Number(e.target.value), false)}
                      className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded border-2 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                    <input
                      type="date"
                      value={lo.supportDate || ''}
                      className="w-28 px-2 py-1.5 text-xs text-center border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                    />
                  </td>
                  <td className="px-2 py-4 text-center border-r border-slate-200 dark:border-border">
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={lo.afterSupportRating || ''}
                      placeholder="--"
                      onChange={e => updateIndividualRating(lo.name, Number(e.target.value), true)}
                      className="w-16 px-2 py-1.5 text-center text-sm font-bold rounded border-2 bg-purple-50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      placeholder="Add remarks..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-border rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-border shadow-sm p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Total Obtained Marks
              </p>
              <p className="text-3xl font-bold text-[#002045] dark:text-blue-300">
                {studentTotalMarks} <span className="text-lg text-slate-400">/ {activeEval.fullMarks}</span>
              </p>
            </div>
            <div className="border-l border-slate-300 dark:border-border pl-8">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Score Percentage
              </p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {studentPercentage.toFixed(2)} <span className="text-lg">/ 100</span>
              </p>
            </div>
            <div className="border-l border-slate-300 dark:border-border pl-8">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Unit-wise Achievement Formula
              </p>
              <code className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 px-3 py-1.5 rounded border border-slate-200 dark:border-border font-mono">
                Achieved % = (Total obtained ÷ {activeEval.fullMarks}) × 100
              </code>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 text-sm font-semibold text-[#002045] dark:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-200 dark:border-border">
              Export Draft
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>

      {saveSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 p-4 bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-lg flex items-center gap-2 z-50"
        >
          <CheckCircle className="w-5 h-5" />
          Marks saved successfully!
        </motion.div>
      )}
    </motion.div>
  );
}
