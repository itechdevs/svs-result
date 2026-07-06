"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Send, AlertCircle, Loader2, Info } from "lucide-react";
import { MarkStatusBadge } from "./MarkStatusBadge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SecondaryPracticalHeading } from "@/types/secondary-marks";

interface PracticalMarkEntry {
  studentId: string;
  studentName: string;
  rollNumber: string;
  section: string;
  isAbsent: boolean;
  headingMarks: Record<string, number | null>; // headingId -> marks
  totalMarks: number;
  status: "DRAFT" | "SUBMITTED" | "VERIFIED" | "LOCKED";
  hasUnsavedChanges: boolean;
  validationError: string | null;
}

interface PracticalMarksEntryTableProps {
  rows: PracticalMarkEntry[];
  practicalHeadings: SecondaryPracticalHeading[];
  fullMarks: number;
  passMarks: number;
  onMarkChange: (studentId: string, headingId: string, marks: number | null) => void;
  onAbsentChange: (studentId: string, isAbsent: boolean) => void;
  onSaveAll: () => Promise<void>;
  onSubmitAll: () => Promise<void>;
  isSaving: boolean;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
}

export function PracticalMarksEntryTable({
  rows,
  practicalHeadings,
  fullMarks,
  passMarks,
  onMarkChange,
  onAbsentChange,
  onSaveAll,
  onSubmitAll,
  isSaving,
  isSubmitting,
  hasUnsavedChanges,
}: PracticalMarksEntryTableProps) {
  const [focusedCell, setFocusedCell] = useState<string | null>(null);

  const handleMarkInput = (studentId: string, headingId: string, value: string) => {
    if (value === "" || value === null) {
      onMarkChange(studentId, headingId, null);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onMarkChange(studentId, headingId, numValue);
    }
  };

  const validateHeadingMarks = (marks: number | null, fullMarks: number): string | null => {
    if (marks === null) return null;
    if (marks < 0) return "Cannot be negative";
    if (marks > fullMarks) return `Max ${fullMarks}`;
    return null;
  };

  const canEdit = (row: PracticalMarkEntry) => {
    return row.status !== "VERIFIED" && row.status !== "LOCKED";
  };

  const sortedHeadings = [...practicalHeadings].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Practical Assessment</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Full Marks: <span className="font-semibold text-foreground">{fullMarks}</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Pass Marks: <span className="font-semibold text-foreground">{passMarks}</span>
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Enter marks for each sub-heading. Total will be calculated automatically.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Unsaved changes
            </span>
          )}

          <Button
            onClick={onSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All
              </>
            )}
          </Button>

          <Button
            onClick={onSubmitAll}
            disabled={hasUnsavedChanges || isSubmitting}
            size="sm"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Practical Headings Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sortedHeadings.map((heading) => (
          <div key={heading.id} className="bg-card border rounded-lg p-2">
            <div className="text-[10px] text-muted-foreground font-medium uppercase truncate">
              {heading.name}
            </div>
            <div className="text-lg font-bold text-foreground">{heading.fullMarks} FM</div>
          </div>
        ))}
      </div>

      {/* Marks Entry Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[70px] sticky left-0 bg-muted/50 z-10">Roll</TableHead>
              <TableHead className="min-w-[180px] sticky left-[70px] bg-muted/50 z-10">Student Name</TableHead>
              <TableHead className="w-[80px]">Section</TableHead>
              <TableHead className="w-[80px] text-center">Absent</TableHead>
              {sortedHeadings.map((heading) => (
                <TableHead key={heading.id} className="w-[100px] text-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold truncate">{heading.name}</span>
                    <span className="text-[10px] text-muted-foreground">({heading.fullMarks} FM)</span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-center bg-primary/5">
                <div className="font-bold">Total</div>
                <div className="text-[10px] text-muted-foreground">({fullMarks} FM)</div>
              </TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[80px] text-center">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6 + sortedHeadings.length} className="text-center py-8 text-muted-foreground">
                  No students found for this class
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const editable = canEdit(row);
                const totalExceedsMax = row.totalMarks > fullMarks;
                const isPassing = !row.isAbsent && row.totalMarks >= passMarks && !totalExceedsMax;
                const cellId = (headingId: string) => `${row.studentId}-${headingId}`;

                return (
                  <TableRow
                    key={row.studentId}
                    className={cn(
                      "transition-colors",
                      row.validationError && "bg-red-50 dark:bg-red-950/10",
                      row.hasUnsavedChanges && !row.validationError && "bg-yellow-50 dark:bg-yellow-950/10",
                      !editable && "bg-gray-50 dark:bg-gray-950/10 opacity-60"
                    )}
                  >
                    {/* Roll Number */}
                    <TableCell className="font-mono font-semibold sticky left-0 bg-inherit">
                      {row.rollNumber}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell className="font-medium sticky left-[70px] bg-inherit">
                      {row.studentName}
                    </TableCell>

                    {/* Section */}
                    <TableCell className="text-muted-foreground">{row.section}</TableCell>

                    {/* Absent Checkbox */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={row.isAbsent}
                          onCheckedChange={(checked) => editable && onAbsentChange(row.studentId, !!checked)}
                          disabled={!editable}
                        />
                      </div>
                    </TableCell>

                    {/* Heading Mark Inputs */}
                    {sortedHeadings.map((heading) => {
                      const marks = row.headingMarks[heading.id];
                      const validationError = validateHeadingMarks(marks, Number(heading.fullMarks));
                      const isFocused = focusedCell === cellId(heading.id);

                      return (
                        <TableCell key={heading.id}>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max={heading.fullMarks}
                              value={row.isAbsent ? "" : marks ?? ""}
                              onChange={(e) => handleMarkInput(row.studentId, heading.id, e.target.value)}
                              onFocus={() => setFocusedCell(cellId(heading.id))}
                              onBlur={() => setFocusedCell(null)}
                              disabled={!editable || row.isAbsent}
                              placeholder={row.isAbsent ? "AB" : "0"}
                              className={cn(
                                "text-center font-semibold h-9 text-sm",
                                validationError && "border-red-500 focus-visible:ring-red-500",
                                row.hasUnsavedChanges && !validationError && "border-amber-500",
                                row.isAbsent && "bg-muted",
                                isFocused && "ring-2 ring-primary"
                              )}
                            />
                            {validationError && (
                              <div className="absolute -bottom-4 left-0 right-0 text-[9px] text-red-600 dark:text-red-400 text-center whitespace-nowrap">
                                {validationError}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}

                    {/* Total Column */}
                    <TableCell className="text-center bg-primary/5">
                      <div className="font-bold text-base">
                        {row.isAbsent ? (
                          <span className="text-muted-foreground text-sm">AB</span>
                        ) : (
                          <span className={cn(
                            totalExceedsMax && "text-red-600 dark:text-red-400"
                          )}>
                            {row.totalMarks.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {totalExceedsMax && !row.isAbsent && (
                        <div className="text-[9px] text-red-600 dark:text-red-400 mt-1">
                          Exceeds max
                        </div>
                      )}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <MarkStatusBadge status={row.status} />
                    </TableCell>

                    {/* Pass/Fail Indicator */}
                    <TableCell className="text-center">
                      {row.isAbsent ? (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      ) : row.totalMarks === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : isPassing ? (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          Pass
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                          Fail
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-lg">
        <p>💡 <strong>Tips:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Enter marks for each sub-heading separately - total is calculated automatically</li>
          <li>Each sub-heading has its own maximum marks limit</li>
          <li>The total must not exceed {fullMarks} marks</li>
          <li>Check "Absent" checkbox to mark a student as absent</li>
          <li>Changes are highlighted in yellow until saved</li>
        </ul>
      </div>
    </div>
  );
}
