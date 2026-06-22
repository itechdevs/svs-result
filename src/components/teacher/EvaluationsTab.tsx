'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, MoreVertical, Pencil, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvaluationPlan } from '@/types/academic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface EvaluationsTabProps {
  evaluations: EvaluationPlan[];
  setSelectedEvaluationId: (id: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation', extraParams?: Record<string, string>) => void;
  setNewEvalTitle: (title: string) => void;
  setNewEvalSubject: (subject: string) => void;
  newEvalSubject: string;
  selectedClass?: string;
  selectedSubject?: string;
  onDelete?: (id: string) => void;
}

export default function EvaluationsTab({
  evaluations,
  setSelectedEvaluationId,
  setCurrentTab,
  setNewEvalTitle,
  setNewEvalSubject,
  newEvalSubject,
  selectedClass = '',
  selectedSubject = '',
  onDelete,
}: EvaluationsTabProps) {
  const qs = new URLSearchParams();
  if (selectedClass) qs.set('class', selectedClass);
  if (selectedSubject) qs.set('subject', selectedSubject);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const deleteTarget = evaluations.find(e => e.id === deleteTargetId);
  const [filter, setFilter] = useState<'All' | 'Published' | 'Draft' | 'Active'>('All');
  const filtered = filter === 'All' ? evaluations : evaluations.filter(e => e.status === filter);

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
          <h2 className="text-2xl font-bold text-foreground">Academic Evaluations Plan</h2>
          {(selectedClass || selectedSubject) && (
            <p className="text-xs text-muted-foreground mt-1">
              Showing: <span className="font-semibold text-foreground">{selectedClass}</span>
              {selectedSubject && <> · <span className="font-semibold text-foreground">{selectedSubject}</span></>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentTab('result-compilation')}
            variant="outline"
            className="font-bold flex items-center gap-2 text-xs shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Result Compilation</span>
          </Button>
          <Button
            onClick={() => setCurrentTab('create-evaluation')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold flex items-center gap-2 text-xs shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Evaluation Plan</span>
          </Button>
        </div>
      </div>

      {(() => {
        const published = evaluations.filter(e => e.status === 'Published').length;
        const drafted = evaluations.filter(e => e.status === 'Draft').length;
        const total = evaluations.length;
        const fmt = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return (
          <div className="grid grid-cols-3 gap-6 bg-card p-5 rounded-2xl border border-border shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Published Cards</p>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 block">{fmt(published)} Published</span>
            </div>
            <div className="border-l border-border pl-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Drafted Cards</p>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{fmt(drafted)} Drafted</span>
            </div>
            <div className="border-l border-border pl-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Evaluations</p>
              <span className="text-2xl font-bold text-destructive mt-1 block">{fmt(total)} Evaluations</span>
            </div>
          </div>
        );
      })()}

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', 'Published', 'Draft', 'Active'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
              filter === f
                ? f === 'Published' ? "bg-blue-600 text-white border-blue-600"
                  : f === 'Draft' ? "bg-amber-500 text-white border-amber-500"
                  : f === 'Active' ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-foreground text-background border-foreground"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Evaluations Plan Cards Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((evalPlan) => (
          <div
            key={evalPlan.id}
            className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col"
          >
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1.5">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                    evalPlan.status === 'Published'
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300"
                      : evalPlan.status === 'Draft'
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                        : evalPlan.status === 'Active'
                          ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                  )}>
                    {evalPlan.status}
                  </span>
                  <span className="text-muted-foreground text-[10px] font-mono block">Created: {evalPlan.date}</span>
                </div>

                {/* Subject badge + kebab */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-muted text-foreground rounded-full uppercase tracking-wider border border-border">
                    {evalPlan.subject}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md shrink-0">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/teacher/edit-evaluation/${evalPlan.subEvaluations?.[0]?.id ?? evalPlan.id}${suffix}`} className="flex items-center gap-2 cursor-pointer w-full">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                            onSelect={() => setDeleteTargetId(evalPlan.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-1">{evalPlan.title}</h3>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">
                  Unit Title
                </label>
                <div className="w-full bg-muted/40 border border-border rounded-lg p-2.5 text-xs text-foreground font-medium min-h-[34px]">
                  {evalPlan.unit || <span className="text-muted-foreground italic">Not set</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Task Types</span>
                  <span className="font-bold text-xs text-foreground font-mono">{evalPlan.testTypes}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block">Outcomes tracked</span>
                  <span className="font-bold text-xs text-foreground font-mono">{evalPlan.outcomes}</span>
                </div>
              </div>

              {/* Preview of what is inside */}
              {evalPlan.learningOutcomes && evalPlan.learningOutcomes.length > 0 && (
                <div className="pt-2">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1.5">Task Types Preview</span>
                  <ul className="text-[10px] text-muted-foreground space-y-1">
                    {Array.from(new Set(evalPlan.learningOutcomes.map(lo => lo.taskType || 'Standard')))
                      .slice(0, 3)
                      .map((tt, idx) => (
                        <li key={idx} className="truncate flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-foreground shrink-0" />
                          <span className="font-semibold text-foreground">{tt}</span>
                        </li>
                      ))}
                    {Array.from(new Set(evalPlan.learningOutcomes.map(lo => lo.taskType))).length > 3 && (
                      <li className="text-[9px] text-muted-foreground italic mt-1 pl-2.5">
                        + {Array.from(new Set(evalPlan.learningOutcomes.map(lo => lo.taskType))).length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-2 border-t border-border/50">
              <Button
                onClick={() => {
                  setSelectedEvaluationId(evalPlan.id);
                  setCurrentTab('mark-entry', {
                    class: evalPlan.gradeLevel || '',
                    subject: evalPlan.subject || '',
                    eval: evalPlan.title,
                  });
                }}
                disabled={evalPlan.status === 'Published'}
                className={cn(
                  "w-full font-bold text-xs",
                  evalPlan.status === 'Published'
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {evalPlan.status === 'Published' ? 'Published' : 'Enter Marks'}
              </Button>
            </div>
          </div>
        ))}

        {/* Block Empty State Dashboard Placeholder */}
        <Button
          variant="outline"
          onClick={() => setCurrentTab('create-evaluation')}
          className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 hover:bg-muted/40 transition-colors text-center group min-h-[300px] h-full"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4 group-hover:scale-110 transition-transform shadow-inner border border-border">
            <Plus className="w-6 h-6 text-foreground" />
          </div>
          <p className="font-bold text-sm text-foreground">Create New Evaluation Plan</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] whitespace-normal">Catalog customized assessment rubrics for your department.</p>
        </Button>
      </div>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evaluation Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { onDelete?.(deleteTargetId!); setDeleteTargetId(null); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
