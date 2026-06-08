'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useTable } from '@/hooks/use-table';
import { DataTable } from '@/components/shared/common/data-table';
import { EvaluationPlan, Student } from '@/types/academic';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shared/ui/tooltip';
import { Eye } from 'lucide-react';

interface StudentMark extends Student {
  marks: Record<string, number>;
  obtainedMarks: number;
  percentage: number;
  status: 'Pass' | 'Fail';
}

interface TableStudentDetailsProps {
  evaluation: EvaluationPlan;
  students: Student[];
  onUpdateMarks?: (studentId: string, outcomeIndex: number, marks: number) => void;
  onViewStudent?: (studentId: string) => void;
}

export function TableStudentDetails({ evaluation, students, onUpdateMarks, onViewStudent }: TableStudentDetailsProps) {
  const learningOutcomes = evaluation.learningOutcomes;

  // Generate student data with marks
  const tableData = useMemo<StudentMark[]>(() => {
    return students.map((student) => {
      const marks: Record<string, number> = {};
      learningOutcomes.forEach((outcome, index) => {
        marks[`L${index + 1}`] = outcome.regularRating || 0;
      });
      
      const obtainedMarks = Object.values(marks).reduce((sum, val) => sum + val, 0);
      const percentage = (obtainedMarks / evaluation.fullMarks) * 100;
      const status = percentage >= (evaluation.passMarks / evaluation.fullMarks) * 100 ? 'Pass' : 'Fail';

      return {
        ...student,
        marks,
        obtainedMarks,
        percentage,
        status,
      };
    });
  }, [students, learningOutcomes, evaluation.fullMarks, evaluation.passMarks]);

  // Generate dynamic columns
  const columns = useMemo<ColumnDef<StudentMark>[]>(() => {
    const baseColumns: ColumnDef<StudentMark>[] = [
      {
        accessorKey: 'rollNo',
        header: 'Roll No.',
        cell: ({ row }) => <div className="font-mono text-xs font-semibold">{row.original.rollNo}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Student Name',
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
    ];

    // Add learning outcome columns
    const outcomeColumns: ColumnDef<StudentMark>[] = learningOutcomes.map((outcome, index) => ({
      id: `L${index + 1}`,
      accessorFn: (row) => row.marks[`L${index + 1}`],
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help font-bold">L{index + 1}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{outcome.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const mark = row.original.marks[`L${index + 1}`];
        return (
          <input
            type="number"
            min="0"
            max={outcome.regularRating || 4}
            value={mark}
            onChange={(e) => onUpdateMarks?.(row.original.id, index, Number(e.target.value))}
            className={cn(
              "w-16 px-2 py-1 text-center text-xs font-semibold rounded border",
              mark >= 3 ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900" :
              mark >= 2 ? "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900" :
              "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900"
            )}
          />
        );
      },
    }));

    const summaryColumns: ColumnDef<StudentMark>[] = [
      {
        accessorKey: 'obtainedMarks',
        header: () => <div className="text-center">Total /{evaluation.fullMarks}</div>,
        cell: ({ row }) => (
          <div className="text-center font-bold text-sm">{row.original.obtainedMarks.toFixed(1)}</div>
        ),
      },
      {
        accessorKey: 'percentage',
        header: () => <div className="text-center">Score %</div>,
        cell: ({ row }) => (
          <div className="text-center font-semibold text-xs">{row.original.percentage.toFixed(1)}%</div>
        ),
      },
      {
        accessorKey: 'status',
        header: () => <div className="text-center">Achieved</div>,
        cell: ({ row }) => (
          <div className={cn(
            "text-center font-bold text-xs px-3 py-1 rounded-full inline-block",
            row.original.status === 'Pass'
              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
              : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
          )}>
            {row.original.percentage.toFixed(1)}%
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <button 
            onClick={() => onViewStudent?.(row.original.id)}
            className="mx-auto flex items-center gap-1 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-border transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        ),
      },
    ];

    return [...baseColumns, ...outcomeColumns, ...summaryColumns];
  }, [learningOutcomes, evaluation.fullMarks, evaluation.passMarks, onUpdateMarks, onViewStudent]);

  const { table } = useTable({
    data: tableData,
    columns,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <span className="font-semibold">Calculation Logic:</span> Achieved % = (Total obtained marks ÷ ({learningOutcomes.length} × 4 × 5)) × 100
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Proficient (≥3)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Needs Support (&lt;2)
          </span>
        </div>
      </div>
      <DataTable table={table} pagination={false} />
    </div>
  );
}
