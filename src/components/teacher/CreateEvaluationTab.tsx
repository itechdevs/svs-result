'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Plus, Copy, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BSCalendarSelector } from '@/components/shared/ui/bs-calendar-selector';

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
  /** Teacher-defined topic/chapter title — independent of assigned subject */
  newSubjectTitle?: string;
  setNewSubjectTitle?: (val: string) => void;
  selectedExamId?: string;
  setSelectedExamId?: (val: string) => void;
  exams?: Array<{ id: string; name: string; description?: string | null }>;
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
  newSubjectTitle = '',
  setNewSubjectTitle,
  selectedExamId = '',
  setSelectedExamId,
  exams = [],
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
        max: 4,
        pass: 2,
        outcomes: [{ name: '', date: '', max: 4, pass: 2 }]
      }
    ]);
  };

  const duplicateTaskGroup = (groupIndex: number) => {
    const groupToClone = newOutcomes[groupIndex];
    // Clone outcomes WITHOUT templateId so they get created as new records on save
    const clonedOutcomes = groupToClone.outcomes.map(out => ({
      name: out.name,
      date: out.date,
      max: out.max,
      pass: out.pass,
    }));
    const clonedGroup = {
      taskType: `${groupToClone.taskType} (Copy)`,
      max: groupToClone.max,
      pass: groupToClone.pass,
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
    setNewOutcomes(prev => prev.map((g, i) =>
      i === groupIndex
        ? { ...g, outcomes: [...g.outcomes, { name: '', date: '', max: 4, pass: 2 }] }
        : g
    ));
  };

  const deleteOutcomeRow = (groupIndex: number, outcomeIndex: number) => {
    setNewOutcomes(prev => prev.map((g, i) =>
      i === groupIndex
        ? { ...g, outcomes: g.outcomes.filter((_, j) => j !== outcomeIndex) }
        : g
    ));
  };

  return (
    <motion.div
      key="create-evaluation-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 relative"
    >
      <div className="sticky top-4 z-50 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card/95 backdrop-blur-sm p-4 rounded-xl border border-border justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentTab('evaluations')}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Button>
          <div>
            <h2 className="font-bold text-sm text-foreground">
              {isEditMode ? 'Edit Evaluation' : 'Create New Evaluation'}
            </h2>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => {
              if (!newEvalTitle?.trim()) {
                toast.error('Please enter an Evaluation Title');
                return;
              }
              if (!newSubjectTitle?.trim()) {
                toast.error('Please enter a Unit Title');
                return;
              }
              if (newOutcomes.length === 0) {
                toast.error('Please add at least one task type');
                return;
              }
              for (const group of newOutcomes) {
                if (!group.taskType?.trim()) {
                  toast.error('Task Type Name cannot be empty');
                  return;
                }
                if (group.outcomes.length === 0) {
                  toast.error(`Please add at least one criteria for ${group.taskType}`);
                  return;
                }
                for (const item of group.outcomes) {
                  if (!item.name?.trim()) {
                    toast.error(`Sub Learning outcome cannot be empty in ${group.taskType}`);
                    return;
                  }
                  if (!item.date) {
                    toast.error(`Assessment Date cannot be empty for ${item.name || 'a criteria'}`);
                    return;
                  }
                  if (item.max === undefined || item.max === null || item.max === '' as any || isNaN(item.max)) {
                    toast.error(`Full Marks cannot be empty for ${item.name}`);
                    return;
                  }
                  if (item.pass === undefined || item.pass === null || item.pass === '' as any || isNaN(item.pass)) {
                    toast.error(`Pass Marks cannot be empty for ${item.name}`);
                    return;
                  }
                }
              }
              handleCreateEvaluation();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold w-full sm:w-auto"
          >
            {isEditMode ? 'Update Evaluation' : 'Save Evaluation Plan'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Metadata Info */}
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-xl space-y-4 shadow-sm">
          <h3 className="font-bold text-xs text-foreground tracking-wider uppercase border-b border-border pb-2">
            Rubric Definition
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                Evaluation Title
              </label>
              <Input
                type="text"
                value={newEvalTitle}
                onChange={e => setNewEvalTitle(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                Unit Title
              </label>
              <Input
                type="text"
                placeholder="e.g. Algebra, Grammar Unit 3, Photosynthesis…"
                value={newSubjectTitle}
                onChange={e => setNewSubjectTitle?.(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {exams.length > 0 && (
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  Exam/Term (Optional)
                </label>
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId?.(e.target.value)}
                  className="w-fit md:w-full text-xs border border-input bg-background px-3 py-2 rounded-md"
                >
                  <option value="" className=''>-- Select Exam/Term --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Select which exam/term this evaluation belongs to (e.g., First Term, Second Term)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Types Array Entries List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Evaluation Task Types</h3>
          <Button
            variant="ghost"
            onClick={addNewTaskGroup}
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task Type</span>
          </Button>
        </div>
        <div className="p-6 space-y-8">
          {newOutcomes.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-4 border border-border rounded-xl p-4 bg-muted/10 relative">
              {/* Desktop Header (Original) */}
              <div className="hidden md:flex flex-row items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-extrabold text-muted-foreground uppercase shrink-0">Task Type Name</label>
                    <Input
                      type="text"
                      value={group.taskType}
                      onChange={e => {
                        const val = e.target.value;
                        setNewOutcomes(prev => prev.map((g, i) =>
                          i === groupIndex ? { ...g, taskType: val } : g
                        ));
                      }}
                      className="w-48 text-xs font-bold text-foreground"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => duplicateTaskGroup(groupIndex)}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400"
                  >
                    <span>Duplicate</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => addNewOutcomeRow(groupIndex)}
                    className="text-[10px] font-bold text-primary"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Criteria</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => deleteTaskGroup(groupIndex)}
                    className="text-[10px] font-bold"
                  >
                    Delete Group
                  </Button>
                </div>
              </div>

              {/* Mobile Header (Stacked) */}
              <div className="flex md:hidden flex-col justify-between gap-4 border-b border-border pb-4">
                <div className="w-full space-y-1.5">
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase block">Task Type Name</label>
                  <Input
                    type="text"
                    value={group.taskType}
                    onChange={e => {
                      const val = e.target.value;
                      setNewOutcomes(prev => prev.map((g, i) =>
                        i === groupIndex ? { ...g, taskType: val } : g
                      ));
                    }}
                    className="w-full text-sm font-bold text-foreground"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTaskGroup(groupIndex)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 w-full flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Duplicate</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addNewOutcomeRow(groupIndex)}
                    className="text-xs font-bold text-primary w-full flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTaskGroup(groupIndex)}
                    className="text-xs font-bold text-destructive hover:text-destructive hover:bg-destructive/10 border-border w-full flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>

              {/* Desktop Rows (Original) */}
              <div className="hidden md:block overflow-x-auto w-full pb-2 mt-3">
                <div className="space-y-3 min-w-[700px]">
                  <div className="grid grid-cols-12 gap-4 font-bold text-muted-foreground text-[10px] uppercase pb-1 px-2">
                    <div className="col-span-4">Sub Learning outcome criteria</div>
                    <div className="col-span-2">Assessment Date</div>
                    <div className="col-span-2 text-center">Full Marks</div>
                    <div className="col-span-2 text-center">Pass Marks</div>
                    <div className="col-span-2 text-center">Actions</div>
                  </div>

                  {group.outcomes.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-card p-2.5 rounded-lg border border-border shadow-sm">
                      <div className="col-span-4">
                        <Input
                          type="text"
                          value={item.name}
                          onChange={e => {
                            const val = e.target.value;
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, name: val } : o) }
                                : g
                            ));
                          }}
                          className="w-full text-xs text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <BSCalendarSelector
                          value={item.date}
                          onChange={v => {
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, date: v } : o) }
                                : g
                            ));
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.max}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, max: val } : o) }
                                : g
                            ));
                          }}
                          className="w-full text-center text-xs font-mono text-foreground"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.pass}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, pass: val } : o) }
                                : g
                            ));
                          }}
                          className="w-full text-center text-xs font-mono text-foreground"
                        />
                      </div>
                      <div className="col-span-2 text-center flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => deleteOutcomeRow(groupIndex, idx)}
                          className="text-[10px] font-bold text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Rows (Stacked) */}
              <div className="block md:hidden w-full pb-2 mt-4">
                <div className="space-y-4">
                  {group.outcomes.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                      <div className="w-full space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase block">Sub Learning Outcome Criteria</label>
                        <Input
                          type="text"
                          value={item.name}
                          onChange={e => {
                            const val = e.target.value;
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, name: val } : o) }
                                : g
                            ));
                          }}
                          className="w-full text-sm text-foreground font-medium"
                        />
                      </div>

                      <div className="flex gap-4 w-full">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-extrabold text-muted-foreground uppercase block">Full Marks</label>
                          <Input
                            type="number"
                            value={item.max}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setNewOutcomes(prev => prev.map((g, i) =>
                                i === groupIndex
                                  ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, max: val } : o) }
                                  : g
                              ));
                            }}
                            className="w-full text-left text-sm font-mono text-foreground"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-extrabold text-muted-foreground uppercase block">Pass Marks</label>
                          <Input
                            type="number"
                            value={item.pass}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setNewOutcomes(prev => prev.map((g, i) =>
                                i === groupIndex
                                  ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, pass: val } : o) }
                                  : g
                              ));
                            }}
                            className="w-full text-left text-sm font-mono text-foreground"
                          />
                        </div>
                      </div>

                      <div className="w-full space-y-1.5">
                        <label className="text-[10px] font-extrabold text-muted-foreground uppercase block">Assessment Date</label>
                        <BSCalendarSelector
                          value={item.date}
                          onChange={v => {
                            setNewOutcomes(prev => prev.map((g, i) =>
                              i === groupIndex
                                ? { ...g, outcomes: g.outcomes.map((o, j) => j === idx ? { ...o, date: v } : o) }
                                : g
                            ));
                          }}
                        />
                      </div>

                      <div className="w-full flex justify-end items-center pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOutcomeRow(groupIndex, idx)}
                          className="text-xs font-bold text-destructive hover:text-destructive flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Remove</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div >
  );
}
