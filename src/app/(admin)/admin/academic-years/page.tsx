"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Calendar, Pencil, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
  AcademicYear,
} from "@/hooks/use-academic-config";
import SanskarLoader from "@/components/shared/SanskarLoader";

export default function AcademicYearsPage() {
  const { data: years, isLoading } = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const updateYear = useUpdateAcademicYear();
  const deleteYear = useDeleteAcademicYear();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setName("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreate = async () => {
    try {
      const isCurrent = !years || years.length === 0;
      await createYear.mutateAsync({
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent,
      });
      resetForm();
      setCreateOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to create academic year");
    }
  };

  const openEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setName(year.name);
    setStartDate(year.startDate.split("T")[0]);
    setEndDate(year.endDate.split("T")[0]);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingYear) return;
    try {
      await updateYear.mutateAsync({
        id: editingYear.id,
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });
      resetForm();
      setEditOpen(false);
      setEditingYear(null);
    } catch (err: any) {
      alert(err.message || "Failed to update academic year");
    }
  };

  const handleSetCurrent = async (year: AcademicYear) => {
    try {
      await updateYear.mutateAsync({
        id: year.id,
        data: { isCurrent: true },
      });
    } catch (err: any) {
      alert(err.message || "Failed to set current year");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteYear.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || "Failed to delete academic year");
    }
  };

  if (isLoading) {
    return <SanskarLoader message="Loading academic years..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Academic Years</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage academic year periods
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-2">
              <Plus className="w-4 h-4" />
              Create Academic Year
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Academic Year</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  Year Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2024/25 or 2081 BS"
                  className="w-full text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { resetForm(); setCreateOpen(false); }} className="text-xs">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!name || !startDate || !endDate || createYear.isPending}
                className="bg-primary text-primary-foreground text-xs font-bold"
              >
                {createYear.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {years && years.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade Configs</TableHead>
                <TableHead>Final Results</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {year.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(year.startDate).toLocaleDateString()} — {new Date(year.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {year.isCurrent ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/40">
                        Current
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {year._count?.gradeConfigs ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {year._count?.finalResults ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!year.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetCurrent(year)}
                          disabled={updateYear.isPending}
                          title="Set as current"
                          className="h-8 w-8 p-0"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(year)}
                        title="Edit"
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {year.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Academic years with published final results cannot be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(year.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No academic years yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Create your first academic year to get started</p>
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditingYear(null); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Year Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2024/25 or 2081 BS"
                className="w-full text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { resetForm(); setEditOpen(false); setEditingYear(null); }} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!name || !startDate || !endDate || updateYear.isPending}
              className="bg-primary text-primary-foreground text-xs font-bold"
            >
              {updateYear.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
