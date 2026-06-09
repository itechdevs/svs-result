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

interface TaskGroup {
  taskType: string;
  max: number;
  pass: number;
  outcomes: OutcomeRow[];
}

interface CreateEvaluationTabProps {
  newEvalTitle: string;
  setNewEvalTitle: (val: string) => void;
  newEvalSubject: string;
  setNewEvalSubject: (val: string) => void;
  targetMarks: number;
  setTargetMarks: (val: number) => void;
  newOutcomes: TaskGroup[];
  setNewOutcomes: React.Dispatch<React.SetStateAction<TaskGroup[]>>;
  handleCreateEvaluation: () => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
  isEditMode?: boolean;
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
  isEditMode = false,
}: CreateEvaluationTabProps) {

  const addNewTaskGroup = () => {
    setNewOutcomes([
      ...newOutcomes,
      {
        taskType: 'New Task Type',
        max: 50,
        pass: 20,
        outcomes: [{ name: 'New Specific Area', date: '2024-05-25', max: 20, pass: 8 }]
      }
    ]);
  };

  const duplicateTaskGroup = (groupIndex: number) => {
    const groupToClone = newOutcomes[groupIndex];
    // Deep clone outcomes so they don't share reference
    const clonedOutcomes = groupToClone.outcomes.map(out => ({ ...out }));
    const clonedGroup = {
      ...groupToClone,
      taskType: `${groupToClone.taskType} (Copy)`,
      outcomes: clonedOutcomes,
    };

    const copy = [...newOutcomes];
    copy.splice(groupIndex + 1, 0, clonedGroup);
    setNewOutcomes(copy);
  };

  const deleteTaskGroup = (groupIndex: number) => {
    setNewOutcomes(newOutcomes.filter((_, i) => i !== groupIndex));
  };

  const addNewOutcomeRow = (groupIndex: number) => {
    const copy = [...newOutcomes];
    copy[groupIndex].outcomes.push({ name: 'New Specific Area', date: '2024-05-25', max: 20, pass: 8 });
    setNewOutcomes(copy);
  };

  const deleteOutcomeRow = (groupIndex: number, outcomeIndex: number) => {
    const copy = [...newOutcomes];
    copy[groupIndex].outcomes = copy[groupIndex].outcomes.filter((_, i) => i !== outcomeIndex);
    setNewOutcomes(copy);
  };

  const calculatedSum = newOutcomes.reduce((acc, currGroup) =>
    acc + currGroup.outcomes.reduce((sum, curr) => sum + Number(curr.max), 0)
    , 0);

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
            <h2 className="font-bold text-sm text-[#002045] dark:text-white mt-0.5">
              {isEditMode ? 'Edit Evaluation Rubric' : 'Create New Evaluation Rubric'}
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateEvaluation}
            className="bg-[#0b6c44] text-white hover:bg-opacity-95 text-xs font-bold py-2 px-5 rounded-lg active:scale-95 transition-all cursor-pointer"
          >
            {isEditMode ? 'Update Evaluation' : 'Save Evaluation Plan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Basic Metadata Info */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white tracking-wider uppercase border-b dark:border-border pb-2">
            Rubric Definition
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                Evaluation Title
              </label>
              <input
                type="text"
                value={newEvalTitle}
                onChange={e => setNewEvalTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#002045] focus:outline-none text-slate-900 dark:text-white"
              />
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
          </div>
        </div>
      </div>

      {/* Task Types Array Entries List */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-border flex justify-between items-center">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Evaluation Task Types</h3>
          <button
            onClick={addNewTaskGroup}
            className="text-xs font-bold text-[#0b6c44] dark:text-[#9ff5c1] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task Type</span>
          </button>
        </div>
        <div className="p-6 space-y-8">
          {newOutcomes.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4 border border-slate-200 dark:border-border rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/10 relative">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase">Task Type Name</label>
                    <input
                      type="text"
                      value={group.taskType}
                      onChange={e => {
                        const copy = [...newOutcomes];
                        copy[groupIndex].taskType = e.target.value;
                        setNewOutcomes(copy);
                      }}
                      className="w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs font-bold text-[#002045] dark:text-white focus:ring-1 focus:ring-[#002045]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => duplicateTaskGroup(groupIndex)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                  >
                    <span>Duplicate</span>
                  </button>
                  <button
                    onClick={() => addNewOutcomeRow(groupIndex)}
                    className="text-[10px] font-bold text-[#0b6c44] dark:text-[#9ff5c1] hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Criteria</span>
                  </button>
                  <button
                    onClick={() => deleteTaskGroup(groupIndex)}
                    className="text-[10px] font-bold text-[#ba1a1a] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 px-2 py-1 rounded cursor-pointer"
                  >
                    Delete Group
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-4 font-bold text-slate-500 text-[10px] uppercase pb-1 px-2">
                  <div className="col-span-4">Sub Learning outcome criteria</div>
                  <div className="col-span-2">Assessment Date</div>
                  <div className="col-span-2 text-center">Full Marks</div>
                  <div className="col-span-2 text-center">Pass Marks</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>

                {group.outcomes.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-card p-2.5 rounded-lg border border-slate-100 dark:border-border shadow-sm">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const copy = [...newOutcomes];
                          copy[groupIndex].outcomes[idx].name = e.target.value;
                          setNewOutcomes(copy);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="date"
                        value={item.date}
                        onChange={e => {
                          const copy = [...newOutcomes];
                          copy[groupIndex].outcomes[idx].date = e.target.value;
                          setNewOutcomes(copy);
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs text-center text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.max}
                        onChange={e => {
                          const copy = [...newOutcomes];
                          copy[groupIndex].outcomes[idx].max = Number(e.target.value);
                          setNewOutcomes(copy);
                        }}
                        className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.pass}
                        onChange={e => {
                          const copy = [...newOutcomes];
                          copy[groupIndex].outcomes[idx].pass = Number(e.target.value);
                          setNewOutcomes(copy);
                        }}
                        className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-[#002045]"
                      />
                    </div>
                    <div className="col-span-2 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => deleteOutcomeRow(groupIndex, idx)}
                        className="p-1 px-3 text-[10px] font-bold text-[#ba1a1a] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div >
  );
}
