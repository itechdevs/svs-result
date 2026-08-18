"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Send, AlertCircle, Loader2 } from "lucide-react";
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
import type { MarkEntryRow } from "@/types/secondary-marks";
import { Checkbox } from "@/components/ui/checkbox";

interface DirectMarksEntryTableProps {
  rows: MarkEntryRow[];
  fullMarks: number;
  passMarks: number;
  componentType: string;
  onMarkChange: (studentId: string, marks: number | null, isAbsent: boolean) => void;
  onSaveAll: () => Promise<void>;
  onSubmitAll: () => Promise<void>;
  isSaving: boolean;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
}

export function DirectMarksEntryTable({
  rows,
  fullMarks,
  passMarks,
  componentType,
  onMarkChange,
  onSaveAll,
  onSubmitAll,
  isSaving,
  isSubmitting,
  hasUnsavedChanges,
}: DirectMarksEntryTableProps) {
  const [focusedRow, setFocusedRow] = useState<string | null>(null);

  const handleMarkInput = (studentId: string, value: string, isAbsent: boolean) => {
    if (isAbsent) {
      onMarkChange(studentId, null, true);
      return;
    }

    if (value === "" || value === null) {
      onMarkChange(studentId, null, false);
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onMarkChange(studentId, Math.min(numValue, fullMarks), false);
    }
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean, currentMarks: number | null) => {
    onMarkChange(studentId, isAbsent ? null : currentMarks, isAbsent);
  };

  const validateMarks = (marks: number | null): string | null => {
    if (marks === null) return null;
    if (marks < 0) return "Marks cannot be negative";
    if (marks > fullMarks) return `Marks cannot exceed ${fullMarks}`;
    return null;
  };

  const getRowStatus = (row: MarkEntryRow) => {
    if (row.validationError) return "error";
    if (row.hasUnsavedChanges) return "unsaved";
    if (row.status === "VERIFIED") return "locked";
    return "normal";
  };

  const canEdit = (row: MarkEntryRow) => {
    return row.status !== "VERIFIED";
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold capitalize">{componentType.toLowerCase()} Examination</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Full Marks: <span className="font-semibold text-foreground">{fullMarks}</span>
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            Pass Marks: <span className="font-semibold text-foreground">{passMarks}</span>
          </span>
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

      {/* Marks Entry Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[100px]">Section</TableHead>
              <TableHead className="w-[120px] text-center">Absent</TableHead>
              <TableHead className="w-[150px]">Marks Obtained</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px] text-center">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No students found for this class
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const rowStatus = getRowStatus(row);
                const editable = canEdit(row);
                const validationError = row.validationError || validateMarks(row.marksObtained);
                const isPassing = !row.isAbsent && row.marksObtained !== null && row.marksObtained >= passMarks;

                return (
                  <TableRow
                    key={row.studentId}
                    className={cn(
                      "transition-colors",
                      rowStatus === "error" && "bg-red-50 dark:bg-red-950/10",
                      rowStatus === "unsaved" && "bg-yellow-50 dark:bg-yellow-950/10",
                      rowStatus === "locked" && "bg-gray-50 dark:bg-gray-950/10 opacity-60",
                      focusedRow === row.studentId && "ring-2 ring-primary ring-inset"
                    )}
                  >
                    {/* Roll Number */}
                    <TableCell className="font-mono font-semibold">
                      {row.rollNumber}
                    </TableCell>

                    {/* Student Name */}
                    <TableCell className="font-medium">{row.studentName}</TableCell>

                    {/* Section */}
                    <TableCell className="text-muted-foreground">{row.section}</TableCell>

                    {/* Absent Checkbox */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={row.isAbsent}
                          onCheckedChange={(checked) =>
                            editable && handleAbsentToggle(row.studentId, !!checked, row.marksObtained)
                          }
                          disabled={!editable}
                        />
                      </div>
                    </TableCell>

                    {/* Marks Input */}
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={fullMarks}
                          value={row.isAbsent ? "" : row.marksObtained ?? ""}
                          onKeyDown={(e) => { if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault(); }}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          onChange={(e) =>
                            handleMarkInput(row.studentId, e.target.value, row.isAbsent)
                          }
                          onFocus={() => setFocusedRow(row.studentId)}
                          onBlur={() => setFocusedRow(null)}
                          disabled={!editable || row.isAbsent}
                          placeholder={row.isAbsent ? "Absent" : "0.00"}
                          className={cn(
                            "text-center font-semibold",
                            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                            validationError && "border-red-500 focus-visible:ring-red-500",
                            row.hasUnsavedChanges && !validationError && "border-amber-500",
                            row.isAbsent && "bg-muted"
                          )}
                        />
                        {validationError && (
                          <div className="absolute -bottom-5 left-0 right-0 text-[10px] text-red-600 dark:text-red-400 text-center">
                            {validationError}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <MarkStatusBadge status={row.status} />
                    </TableCell>

                    {/* Pass/Fail Indicator */}
                    <TableCell className="text-center">
                      {row.isAbsent ? (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      ) : row.marksObtained === null ? (
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
          <li>Use Tab key to navigate between input fields</li>
          <li>Check "Absent" checkbox to mark a student as absent</li>
          <li>Changes are highlighted in yellow until saved</li>
          <li>Click "Save All" to save as draft, then "Submit All" for verification</li>
        </ul>
      </div>
    </div>
  );
}
