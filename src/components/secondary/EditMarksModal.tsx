"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/shared/ui/dialog";
import { Input } from "@/components/shared/ui/input";
import { Checkbox } from "@/components/shared/ui/checkbox";

interface MarkField {
  markId: string;
  componentType: string;
  marksObtained: number | null;
  fullMarks: number;
  passMarks: number;
  isAbsent: boolean;
}

interface EditMarksModalProps {
  open: boolean;
  onClose: () => void;
  studentName: string;
  rollNumber: string;
  subjectName: string;
  theory: MarkField | null;
  practical: MarkField | null;
  onSaved: () => void;
}

export function EditMarksModal({
  open,
  onClose,
  studentName,
  rollNumber,
  subjectName,
  theory,
  practical,
  onSaved,
}: EditMarksModalProps) {
  const [theoryMarks, setTheoryMarks] = useState<string>("");
  const [practicalMarks, setPracticalMarks] = useState<string>("");
  const [isTheoryAbsent, setIsTheoryAbsent] = useState(false);
  const [isPracticalAbsent, setIsPracticalAbsent] = useState(false);

  useEffect(() => {
    if (open) {
      setTheoryMarks(theory?.marksObtained != null ? String(theory.marksObtained) : "");
      setPracticalMarks(practical?.marksObtained != null ? String(practical.marksObtained) : "");
      setIsTheoryAbsent(theory?.isAbsent || false);
      setIsPracticalAbsent(practical?.isAbsent || false);
    }
  }, [open, theory, practical]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Promise<any>[] = [];

      if (theory) {
        const value = isTheoryAbsent ? null : Number(theoryMarks);
        updates.push(
          apiClient.put(`/admin/secondary/marks/${theory.markId}`, {
            marksObtained: value,
            isAbsent: isTheoryAbsent,
          })
        );
      }

      if (practical) {
        const value = isPracticalAbsent ? null : Number(practicalMarks);
        updates.push(
          apiClient.put(`/admin/secondary/marks/${practical.markId}`, {
            marksObtained: value,
            isAbsent: isPracticalAbsent,
          })
        );
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
      toast.success("Marks updated successfully");
      onSaved();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update marks");
    },
  });

  const handleSave = () => {
    if (theory && !isTheoryAbsent) {
      if (theoryMarks === "" || isNaN(Number(theoryMarks))) {
        toast.warning("Please enter valid theory marks");
        return;
      }
      const val = Number(theoryMarks);
      if (val < 0 || val > theory.fullMarks) {
        toast.warning(`Theory marks must be between 0 and ${theory.fullMarks}`);
        return;
      }
    }

    if (practical && !isPracticalAbsent) {
      if (practicalMarks === "" || isNaN(Number(practicalMarks))) {
        toast.warning("Please enter valid practical marks");
        return;
      }
      const val = Number(practicalMarks);
      if (val < 0 || val > practical.fullMarks) {
        toast.warning(`Practical marks must be between 0 and ${practical.fullMarks}`);
        return;
      }
    }

    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Marks</DialogTitle>
          <DialogDescription>
            {studentName} — Roll: {rollNumber} — {subjectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {theory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Theory Marks (Full: {theory.fullMarks}, Pass: {theory.passMarks})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isTheoryAbsent}
                    onCheckedChange={(checked) => setIsTheoryAbsent(!!checked)}
                  />
                  <span className="font-medium text-xs">Absent in Theory</span>
                </label>
              </div>
              <Input
                type="number"
                min={0}
                max={theory.fullMarks}
                value={isTheoryAbsent ? "" : theoryMarks}
                onChange={(e) => setTheoryMarks(e.target.value)}
                disabled={isTheoryAbsent}
                placeholder={isTheoryAbsent ? "Absent" : `Enter marks (0-${theory.fullMarks})`}
              />
            </div>
          )}

          {practical && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Practical Marks (Full: {practical.fullMarks}, Pass: {practical.passMarks})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={isPracticalAbsent}
                    onCheckedChange={(checked) => setIsPracticalAbsent(!!checked)}
                  />
                  <span className="font-medium text-xs">Absent in Practical</span>
                </label>
              </div>
              <Input
                type="number"
                min={0}
                max={practical.fullMarks}
                value={isPracticalAbsent ? "" : practicalMarks}
                onChange={(e) => setPracticalMarks(e.target.value)}
                disabled={isPracticalAbsent}
                placeholder={isPracticalAbsent ? "Absent" : `Enter marks (0-${practical.fullMarks})`}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1" />
            )}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
