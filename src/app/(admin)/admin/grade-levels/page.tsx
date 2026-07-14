"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Layers, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { useGradeLevels } from "@/hooks/use-subjects";
import {
  useGradeLevelCategories,
  useUpdateGradeLevelCategories,
} from "@/hooks/use-grade-level-categories";
import SanskarLoader from "@/components/shared/SanskarLoader";

const SCHOOL_LEVEL_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-Primary",
  PRIMARY: "Primary",
  SECONDARY: "Secondary",
  HIGHER: "Higher",
};

const SCHOOL_LEVELS = ["PRE_PRIMARY", "PRIMARY", "SECONDARY", "HIGHER"] as const;

export default function GradeLevelsPage() {
  const { data: gradeLevels, isLoading: isLoadingGrades } = useGradeLevels();
  const { data: categories, isLoading: isLoadingCategories } =
    useGradeLevelCategories();
  const updateCategories = useUpdateGradeLevelCategories();

  const [mappings, setMappings] = useState<
    Record<string, string | undefined>
  >({});

  const initialised = useMemo(() => {
    if (!gradeLevels || !categories) return {};
    const catMap: Record<string, string | undefined> = {};
    for (const c of categories) {
      catMap[c.gradeLevel] = c.schoolLevel;
    }
    for (const g of gradeLevels) {
      if (!(g in catMap)) {
        catMap[g] = undefined;
      }
    }
    return catMap;
  }, [gradeLevels, categories]);

  const currentMappings =
    Object.keys(mappings).length > 0 ? mappings : initialised;

  const hasChanges = useMemo(() => {
    if (!gradeLevels || !categories) return false;
    const catMap: Record<string, string | undefined> = {};
    for (const c of categories) {
      catMap[c.gradeLevel] = c.schoolLevel;
    }
    for (const g of gradeLevels) {
      if (currentMappings[g] !== (catMap[g] ?? undefined)) return true;
    }
    return false;
  }, [gradeLevels, categories, currentMappings]);

  const handleLevelChange = (gradeLevel: string, schoolLevel: string) => {
    setMappings((prev) => ({
      ...prev,
      [gradeLevel]: schoolLevel === "unassigned" ? undefined : schoolLevel,
    }));
  };

  const handleSave = async () => {
    if (!gradeLevels) return;
    const payload = gradeLevels
      .filter((g) => currentMappings[g])
      .map((g) => ({
        gradeLevel: g,
        schoolLevel: currentMappings[g]!,
      }));

    if (payload.length === 0) {
      toast.error("Assign at least one grade level before saving");
      return;
    }

    try {
      await updateCategories.mutateAsync(payload);
      setMappings({});
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const isLoading = isLoadingGrades || isLoadingCategories;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Grade Level Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Assign each grade level to a school level for proper result
            calculation
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateCategories.isPending}
          className="bg-primary text-primary-foreground text-xs font-bold h-9 px-4 rounded-lg"
        >
          {updateCategories.isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <SanskarLoader />
          </div>
        ) : !gradeLevels || gradeLevels.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No grade levels found. Sync subjects and students first.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  #
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Grade Level
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  School Level
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeLevels.map((level, index) => (
                <TableRow key={level}>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {level}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentMappings[level] ?? "unassigned"}
                      onValueChange={(v) => handleLevelChange(level, v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        </SelectItem>
                        {SCHOOL_LEVELS.map((sl) => (
                          <SelectItem key={sl} value={sl}>
                            {SCHOOL_LEVEL_LABELS[sl]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {gradeLevels && gradeLevels.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <strong>{gradeLevels.length}</strong> grade level
          {gradeLevels.length !== 1 ? "s" : ""} loaded
        </div>
      )}
    </motion.div>
  );
}
