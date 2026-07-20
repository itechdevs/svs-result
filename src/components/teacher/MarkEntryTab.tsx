'use client';

import React from 'react';
import { formatNum } from '@/lib/format-num';
import { motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { EvaluationPlan, Student } from '@/types/academic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MarkEntryTabProps {
  evaluations: EvaluationPlan[];
  students: Student[];
  selectedEvaluationId: string;
  setSelectedEvaluationId: (id: string) => void;
  gradingStudentId: string;
  setGradingStudentId: (id: string) => void;
  saveSuccessMessage: boolean;
  setSaveSuccessMessage: (val: boolean) => void;
  updateIndividualRating: (outcomeName: string, value: number) => void;
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
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Student Selection
            </label>
            <Select value={gradingStudentId} onValueChange={setGradingStudentId}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s, index) => (
                  <SelectItem key={s.id} value={s.id}>
                    {`${String(index + 1).padStart(2, '0')}. ${s.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={handlePrevStudent}
              >
                ←
              </Button>
              <Button 
                variant="outline"
                className="font-semibold"
                onClick={handleNextStudent}
              >
                Next →
              </Button>
            </div>

            <Button variant="outline" className="flex items-center gap-2">
              <span>📄</span> Export
            </Button>
          </div>
        </div>
      </div>

      {/* Unit Title and Assessment Date */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Unit Title
            </label>
            <Input
              type="text"
              value={`${activeEval.unit || activeEval.title}`}
              readOnly
              className="w-full font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Assessment Date
            </label>
            <Input
              type="text"
              value={activeEval.date}
              readOnly
              className="w-full font-medium"
            />
          </div>
        </div>
      </div>

      {/* Learning Outcomes Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-x-auto w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-900/50">
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border text-center w-16">
                S.N.
              </TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border w-40">
                Language Skills
              </TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border">
                Learning Outcome Indicators
              </TableHead>
              <TableHead className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center border-r border-border bg-emerald-500/5" colSpan={2}>
                Regular Class Assessment
              </TableHead>
              <TableHead className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Remarks
              </TableHead>
            </TableRow>
            <TableRow className="bg-muted/40 border-t border-border text-[9px] font-semibold text-slate-500 uppercase">
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="border-r border-border"></TableHead>
              <TableHead className="text-center border-r border-border">Date</TableHead>
              <TableHead className="text-center border-r border-border">Rating</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeEval.learningOutcomes.map((lo, index) => (
              <TableRow key={index} className="hover:bg-muted/20 transition-colors">
                <TableCell className="text-center font-mono text-sm font-semibold text-foreground border-r border-border">
                  {index + 1}
                </TableCell>
                <TableCell className="font-semibold text-sm text-blue-700 dark:text-blue-400 border-r border-border">
                  {lo.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground leading-relaxed border-r border-border whitespace-normal max-w-sm">
                  {lo.text}
                </TableCell>
                <TableCell className="text-center border-r border-border">
                  <Input
                    type="date"
                    value={lo.regularDate || ''}
                    className="w-28 text-xs text-center mx-auto"
                    readOnly
                  />
                </TableCell>
                <TableCell className="text-center border-r border-border">
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={lo.regularRating || ''}
                    onChange={e => updateIndividualRating(lo.name, Number(e.target.value))}
                    className="w-16 text-center text-sm font-bold mx-auto bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    placeholder="Add remarks..."
                    className="w-full text-xs"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Calculation Footer */}
      <div className="bg-muted/30 rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 w-full lg:w-auto">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Total Obtained Marks
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {studentTotalMarks} <span className="text-lg text-muted-foreground">/ {activeEval.fullMarks}</span>
              </p>
            </div>
            <div className="sm:border-l sm:border-border sm:pl-8">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Score Percentage
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNum(studentPercentage, 2)} <span className="text-lg">/ 100</span>
              </p>
            </div>
            <div className="sm:border-l sm:border-border sm:pl-8 w-full sm:w-auto">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Unit-wise Achievement Formula
              </p>
              <code className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded border border-border font-mono block sm:inline-block">
                Achieved % = (Total obtained ÷ {activeEval.fullMarks}) × 100
              </code>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" className="px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold">
              Export Draft
            </Button>
            <Button
              onClick={handleSave}
              className="px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90"
            >
              Save &amp; Continue
            </Button>
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
