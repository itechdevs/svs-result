"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Save, AlertCircle, Percent, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useAcademicYears,
  useGradeConfigs,
  useCreateGradeConfig,
  GradeConfig,
} from "@/hooks/use-academic-config";
import { useGradeLevels } from "@/hooks/use-subjects";
import {
  useUpdateGradeConfig,
  useDeleteGradeConfig,
  useUpsertGradeScales,
} from "@/hooks/use-grade-config-crud";
import SanskarLoader from "@/components/shared/SanskarLoader";

const GRADE_TYPE_LABELS: Record<string, string> = {
  LETTER: "Letter (A+, A, B...)",
  GPA: "GPA (4.0 scale)",
  DESCRIPTIVE: "Descriptive (Outstanding, Excellent...)",
};

export default function GradeConfigsPage() {
  const { data: academicYears } = useAcademicYears();
  const { data: gradeLevels } = useGradeLevels();
  const createConfig = useCreateGradeConfig();
  const updateConfig = useUpdateGradeConfig();
  const deleteConfig = useDeleteGradeConfig();
  const upsertScales = useUpsertGradeScales();

  const [academicYearId, setAcademicYearId] = useState("");
  const [selectedGradeLevel, setSelectedGradeLevel] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const { data: configs, isLoading } = useGradeConfigs(
    academicYearId && selectedGradeLevel
      ? { academicYearId, gradeLevel: selectedGradeLevel }
      : {},
  );

  const currentConfig = useMemo(() => {
    if (!configs || !selectedGradeLevel) return null;
    return (
      configs.find((c) => c.gradeLevel === selectedGradeLevel) ?? null
    );
  }, [configs, selectedGradeLevel]);

  const [gradeType, setGradeType] = useState("DESCRIPTIVE");
  const [passCriteria, setPassCriteria] = useState("");

  // Scale editing state
  const [editingScales, setEditingScales] = useState<
    { minPercent: string; maxPercent: string; grade: string; gradePoint: string; description: string }[]
  >([]);
  const [scalesDirty, setScalesDirty] = useState(false);
  const [editConfigOpen, setEditConfigOpen] = useState(false);

  const handleFindOrCreate = async () => {
    if (!academicYearId || !selectedGradeLevel) {
      toast.error("Select academic year and grade level first");
      return;
    }

    if (currentConfig) {
      setGradeType(currentConfig.gradeType);
      setPassCriteria(currentConfig.passCriteria || "");
      const scales = (currentConfig.gradeScales || []).map((s) => ({
        minPercent: String(s.minPercent),
        maxPercent: String(s.maxPercent),
        grade: s.grade,
        gradePoint: s.gradePoint != null ? String(s.gradePoint) : "",
        description: s.description || "",
      }));
      setEditingScales(scales);
      setScalesDirty(false);
      setShowConfig(true);
      return;
    }

    try {
      await createConfig.mutateAsync({
        academicYearId,
        gradeLevel: selectedGradeLevel,
        gradeType: "DESCRIPTIVE",
      });
      setGradeType("DESCRIPTIVE");
      setPassCriteria("");
      setEditingScales([]);
      setScalesDirty(false);
      setShowConfig(true);
      toast.success("Grade config created");
    } catch (err: any) {
      toast.error(err.message || "Failed to create grade config");
    }
  };

  const handleUpdateConfig = async () => {
    if (!currentConfig) return;
    try {
      await updateConfig.mutateAsync({
        id: currentConfig.id,
        data: { gradeType, passCriteria: passCriteria || null },
      });
      setEditConfigOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const addScaleRow = () => {
    setEditingScales((prev) => [
      ...prev,
      { minPercent: "", maxPercent: "", grade: "", gradePoint: "", description: "" },
    ]);
    setScalesDirty(true);
  };

  const removeScaleRow = (idx: number) => {
    setEditingScales((prev) => prev.filter((_, i) => i !== idx));
    setScalesDirty(true);
  };

  const updateScaleRow = (
    idx: number,
    field: string,
    value: string,
  ) => {
    setEditingScales((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
    setScalesDirty(true);
  };

  const handleSaveScales = async () => {
    if (!currentConfig) return;
    const scales = editingScales
      .filter((s) => s.minPercent && s.maxPercent && s.grade)
      .map((s) => ({
        minPercent: Number(s.minPercent),
        maxPercent: Number(s.maxPercent),
        grade: s.grade,
        gradePoint: s.gradePoint ? Number(s.gradePoint) : undefined,
        description: s.description || undefined,
      }));

    if (scales.length === 0) {
      toast.error("Add at least one grade scale row");
      return;
    }

    try {
      await upsertScales.mutateAsync({ gradeConfigId: currentConfig.id, scales });
      setScalesDirty(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save scales");
    }
  };

  const handleDeleteConfig = async () => {
    if (!currentConfig) return;
    try {
      await deleteConfig.mutateAsync(currentConfig.id);
      setShowConfig(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Grade Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure grading rules and grade scales per academic year and grade
          level
        </p>
      </div>

      {/* ── Selectors ── */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Academic Year
            </label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears?.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Grade Level
            </label>
            <Select
              value={selectedGradeLevel}
              onValueChange={setSelectedGradeLevel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels?.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleFindOrCreate}
            disabled={!academicYearId || !selectedGradeLevel || createConfig.isPending}
            className="bg-primary text-primary-foreground text-xs font-bold h-9 px-5"
          >
            {isLoading ? "Loading..." : currentConfig ? "Edit Config" : "Create Config"}
          </Button>
        </div>
      </div>

      {/* ── Grade Config Detail ── */}
      {showConfig && currentConfig && (
        <div className="space-y-6">
          {/* Config card */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {currentConfig.gradeLevel} —{" "}
                  {currentConfig.academicYear?.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grade Type:{" "}
                  {GRADE_TYPE_LABELS[currentConfig.gradeType] || currentConfig.gradeType}
                  {currentConfig.passCriteria
                    ? ` · Pass: ${currentConfig.passCriteria}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setEditConfigOpen(true)}
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1 text-destructive hover:bg-destructive/10"
                  onClick={handleDeleteConfig}
                  disabled={deleteConfig.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Grade Scales */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Grade Scales
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={addScaleRow}
                  >
                    <Plus className="w-3 h-3" />
                    Add Row
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs gap-1 bg-primary text-primary-foreground"
                    onClick={handleSaveScales}
                    disabled={!scalesDirty || upsertScales.isPending}
                  >
                    <Save className="w-3 h-3" />
                    {upsertScales.isPending ? "Saving..." : "Save Scales"}
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-[10px] font-bold text-muted-foreground uppercase">
                        Min%
                      </TableHead>
                      <TableHead className="w-16 text-[10px] font-bold text-muted-foreground uppercase">
                        Max%
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-muted-foreground uppercase">
                        Grade
                      </TableHead>
                      <TableHead className="w-16 text-[10px] font-bold text-muted-foreground uppercase">
                        Point
                      </TableHead>
                      <TableHead className="text-[10px] font-bold text-muted-foreground uppercase">
                        Description
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editingScales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No grade scales defined. Click "Add Row" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                    {editingScales.map((scale, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={scale.minPercent}
                            onChange={(e) => updateScaleRow(idx, "minPercent", e.target.value)}
                            className="h-8 text-xs w-16"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={scale.maxPercent}
                            onChange={(e) => updateScaleRow(idx, "maxPercent", e.target.value)}
                            className="h-8 text-xs w-16"
                            placeholder="100"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={scale.grade}
                            onChange={(e) => updateScaleRow(idx, "grade", e.target.value)}
                            className="h-8 text-xs"
                            placeholder="A+"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="4"
                            step="0.1"
                            value={scale.gradePoint}
                            onChange={(e) => updateScaleRow(idx, "gradePoint", e.target.value)}
                            className="h-8 text-xs w-16"
                            placeholder="4.0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={scale.description}
                            onChange={(e) => updateScaleRow(idx, "description", e.target.value)}
                            className="h-8 text-xs"
                            placeholder="Outstanding"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeScaleRow(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {scalesDirty && (
                <div className="flex items-center gap-2 mt-3 px-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    You have unsaved changes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Config Dialog ── */}
      <Dialog open={editConfigOpen} onOpenChange={setEditConfigOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Grade Config</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Grade Type
              </label>
              <Select value={gradeType} onValueChange={setGradeType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GRADE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Pass Criteria
              </label>
              <Input
                value={passCriteria}
                onChange={(e) => setPassCriteria(e.target.value)}
                placeholder='e.g. "Pass all evaluations"'
                className="w-full text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditConfigOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateConfig}
              disabled={updateConfig.isPending}
              className="bg-primary text-primary-foreground text-xs font-bold"
            >
              {updateConfig.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
