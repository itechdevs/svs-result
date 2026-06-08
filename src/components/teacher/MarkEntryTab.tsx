'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { EvaluationPlan, Student } from '@/types/academic';
import { TableStudentDetails } from './TablestudentDetails';

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

  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const activeEval = evaluations.find(e => e.id === selectedEvaluationId) || evaluations[0];
  const viewingStudent = students.find(s => s.id === viewingStudentId);

  // Calculate total obtained marks from regularRating entries
  const studentTotalMarks = activeEval.learningOutcomes.reduce(
    (sum, lo) => sum + (lo.regularRating || 0), 0
  );
  const studentPercentage = activeEval.fullMarks > 0
    ? (studentTotalMarks / activeEval.fullMarks) * 100
    : 0;
  // Pass/Fail is determined by activeEval.passMarks from the evaluation tab
  const studentStatus = studentTotalMarks >= activeEval.passMarks ? 'Pass' : 'Fail';

  const handleSave = () => {
    setSaveSuccessMessage(true);
    setTimeout(() => setSaveSuccessMessage(false), 2500);
  };

  const handleUpdateMarks = (studentId: string, outcomeIndex: number, marks: number) => {
    console.log('Update marks:', { studentId, outcomeIndex, marks });
  };

  const handleViewStudent = (studentId: string) => {
    setViewingStudentId(studentId);
    setGradingStudentId(studentId);
  };

  const handleBackToList = () => {
    setViewingStudentId(null);
  };

  return (
    <motion.div
      key="mark-entry-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* ── Student Detail View ── */}
      {viewingStudentId && viewingStudent ? (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
            <div>
              <h2 className="text-2xl font-bold text-[#002045] dark:text-white">
                {viewingStudent.name} ({viewingStudent.rollNo})
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeEval.title} — {activeEval.subject}
              </p>
            </div>
          </div>

          {saveSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-between border border-emerald-200 dark:border-emerald-900"
            >
              <span>Marks saved successfully!</span>
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}

          <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-border shadow-sm">
            <h3 className="text-sm font-bold text-[#002045] dark:text-white mb-4">
              Learning Outcomes Worksheet
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase border-b border-slate-200 dark:border-border">
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Description</th>
                    {/* Read-only columns sourced from the evaluation plan */}
                    <th className="px-4 py-3 text-center">Full Marks</th>
                    <th className="px-4 py-3 text-center">Pass Marks</th>
                    {/* Editable mark-entry column */}
                    <th className="px-4 py-3 text-center">Marks Obtained</th>
                    {/* After-support column */}
                    <th className="px-4 py-3 text-center">After Support</th>
                    {/* Inline pass/fail per outcome */}
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 dark:divide-border">
                  {activeEval.learningOutcomes.map((lo, index) => {
                    const obtained = lo.regularRating || 0;
                    // Per-outcome pass marks: use lo.passMarks if available,
                    // otherwise fall back to the evaluation-level passMarks
                    const loPassMarks = (lo as any).passMarks ?? activeEval.passMarks;
                    const loFullMarks = (lo as any).fullMarks ?? activeEval.fullMarks;
                    const loStatus = obtained >= loPassMarks ? 'Pass' : 'Fail';

                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-[#002045] dark:text-blue-300">
                          {lo.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {lo.text}
                        </td>

                        {/* Full Marks — read-only from evaluation plan */}
                        <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {loFullMarks}
                        </td>

                        {/* Pass Marks — read-only from evaluation plan */}
                        <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {loPassMarks}
                        </td>

                        {/* Marks Obtained — editable */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={loFullMarks}
                            value={lo.regularRating ?? ''}
                            placeholder="0"
                            onChange={e =>
                              updateIndividualRating(lo.name, Number(e.target.value), false)
                            }
                            className="w-16 px-2 py-1.5 text-center text-xs font-bold rounded border bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </td>

                        {/* After Support — editable */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={loFullMarks}
                            value={lo.afterSupportRating ?? ''}
                            placeholder="—"
                            onChange={e =>
                              updateIndividualRating(lo.name, Number(e.target.value), true)
                            }
                            className="w-16 px-2 py-1.5 text-center text-xs font-bold rounded border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>

                        {/* Per-outcome Pass/Fail status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${loStatus === 'Pass'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                            }`}>
                            {loStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Overall Status Summary */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Obtained Marks</p>
                  <p className="text-lg font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                    {studentTotalMarks} / {activeEval.fullMarks}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pass Marks</p>
                  <p className="text-lg font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                    {activeEval.passMarks}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Percentage</p>
                  <p className="text-lg font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                    {studentPercentage.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <span className={`inline-block mt-0.5 px-3 py-1.5 rounded-full text-xs font-bold ${studentStatus === 'Pass'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300'
                    }`}>
                    {studentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Save Student Marks
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── Student List View ── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#002045] dark:text-white">Marking Center</h2>
              <p className="text-xs text-slate-500 mt-1">Enter student marks for learning outcomes</p>
            </div>
            <button
              onClick={handleSave}
              className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2.5 px-6 rounded-xl shadow-sm transform active:scale-95 transition-all cursor-pointer"
            >
              Save All Marks
            </button>
          </div>

          {saveSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-between border border-emerald-200 dark:border-emerald-900"
            >
              <span>Marks saved successfully!</span>
              <CheckCircle className="w-5 h-5" />
            </motion.div>
          )}

          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Select Evaluation Plan
                </label>
                <select
                  value={selectedEvaluationId}
                  onChange={e => setSelectedEvaluationId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border px-4 py-2.5 rounded-xl font-bold text-xs text-[#002045] dark:text-white focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1] focus:outline-none cursor-pointer"
                >
                  {evaluations.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.title} — {e.subject} ({e.testTypes})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Subject</p>
                <p className="text-sm font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                  {activeEval.subject}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Full Marks</p>
                <p className="text-sm font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                  {activeEval.fullMarks}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pass Marks</p>
                <p className="text-sm font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                  {activeEval.passMarks}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                <p className="text-sm font-bold text-[#002045] dark:text-blue-300 mt-0.5">
                  {activeEval.date}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-border shadow-sm">
            <h3 className="text-sm font-bold text-[#002045] dark:text-white mb-4">Student Marks Entry</h3>
            <TableStudentDetails
              evaluation={activeEval}
              students={students}
              onUpdateMarks={handleUpdateMarks}
              onViewStudent={handleViewStudent}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}