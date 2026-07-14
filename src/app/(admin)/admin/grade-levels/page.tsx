"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Save } from "lucide-react";
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
import { useGradeLevelsWithSection } from "@/hooks/use-subjects";
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
  const { data: classSections, isLoading: isLoadingGrades } =
    useGradeLevelsWithSection();
  const { data: categories, isLoading: isLoadingCategories } =
    useGradeLevelCategories();
  const updateCategories = useUpdateGradeLevelCategories();

  const [mappings, setMappings] = useState<Record<string, string | undefined>>(
    {},
  );

  // Unique base grade levels for category mapping (categories apply per grade, not per section)
  const uniqueGradeLevels = useMemo(() => {
    if (!classSections) return [];
    const seen = new Set<string>();
    return classSections
      .map((c) => c.gradeLevel)
      .filter((g) => {
        if (seen.has(g)) return false;
        seen.add(g);
        return true;
      });
  }, [classSections]);

  const initialised = useMemo(() => {
    if (!uniqueGradeLevels.length || !categories) return {};
    const catMap: Record<string, string | undefined> = {};
    for (const c of categories) {
      catMap[c.gradeLevel] = c.schoolLevel;
    }
    for (const g of uniqueGradeLevels) {
      if (!(g in catMap)) {
        catMap[g] = undefined;
      }
    }
    return catMap;
  }, [uniqueGradeLevels, categories]);

  const currentMappings =
    Object.keys(mappings).length > 0 ? mappings : initialised;

  const hasChanges = useMemo(() => {
    if (!uniqueGradeLevels.length || !categories) return false;
    const catMap: Record<string, string | undefined> = {};
    for (const c of categories) {
      catMap[c.gradeLevel] = c.schoolLevel;
    }
    for (const g of uniqueGradeLevels) {
      if (currentMappings[g] !== (catMap[g] ?? undefined)) return true;
    }
    return false;
  }, [uniqueGradeLevels, categories, currentMappings]);

  const handleLevelChange = (gradeLevel: string, schoolLevel: string) => {
    setMappings((prev) => ({
      ...prev,
      [gradeLevel]: schoolLevel === "unassigned" ? undefined : schoolLevel,
    }));
  };

  const handleSave = async () => {
    const payload = uniqueGradeLevels
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
        ) : !classSections || classSections.length === 0 ? (
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
                  Class
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  School Level
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classSections.map((item, index) => (
                <TableRow key={`${item.gradeLevel}-${item.section}`}>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {item.displayName}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={currentMappings[item.gradeLevel] ?? "unassigned"}
                      onValueChange={(v) =>
                        handleLevelChange(item.gradeLevel, v)
                      }
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

      {classSections && classSections.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <strong>{classSections.length}</strong> class
          {classSections.length !== 1 ? "es" : ""} across{" "}
          <strong>{uniqueGradeLevels.length}</strong> grade level
          {uniqueGradeLevels.length !== 1 ? "s" : ""} loaded
        </div>
      )}
    </motion.div>
  );
}
