"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/ui/button";
import SanskarLoader from "@/components/shared/SanskarLoader";
import { useStudents } from "@/hooks/use-students";
import { useGradeLevelsWithSection } from "@/hooks/use-subjects";

export default function SyncedStudentsPage() {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: classSections } = useGradeLevelsWithSection();

  const { data, isLoading } = useStudents({
    search: search || undefined,
    class: classFilter || undefined,
    section: sectionFilter || undefined,
    page,
    limit: 20,
  });

  const uniqueClasses = classSections
    ? [...new Set(classSections.map((c) => c.gradeLevel))].sort()
    : [];

  const uniqueSections = classSections
    ? [
        ...new Set(
          classSections
            .filter((c) => !classFilter || c.gradeLevel === classFilter)
            .map((c) => c.section),
        ),
      ].sort()
    : [];

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    [],
  );

  const handleClassChange = useCallback((value: string) => {
    setClassFilter(value === "all" ? "" : value);
    setSectionFilter("");
    setPage(1);
  }, []);

  const handleSectionChange = useCallback((value: string) => {
    setSectionFilter(value === "all" ? "" : value);
    setPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Synced Students
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            View all students synced from the school management system
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={search}
            onChange={handleSearch}
            className="pl-9 text-sm h-9"
          />
        </div>
        <Select value={classFilter || "all"} onValueChange={handleClassChange}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sectionFilter || "all"}
          onValueChange={handleSectionChange}
        >
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {uniqueSections.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-x-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <SanskarLoader />
          </div>
        ) : !data || data.students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No synced students found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search || classFilter || sectionFilter
                ? "Try adjusting your search or filters"
                : "Sync students from the school management system first"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  #
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Name
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Roll No.
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Class
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Section
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Last Synced
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.students.map((student, index) => (
                <TableRow key={student.id}>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {(page - 1) * data.limit + index + 1}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.rollNumber}
                  </TableCell>
                  <TableCell className="text-sm">{student.class}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.section || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.isActive ? "default" : "secondary"}
                      className={
                        student.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/40"
                          : ""
                      }
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(student.syncedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(page - 1) * data.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * data.limit, data.total)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{data.total}</span>{" "}
            students
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - page) <= 1,
              )
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="text-xs text-muted-foreground px-1">
                      ...
                    </span>
                  )}
                  <Button
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 p-0 text-xs ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : ""
                    }`}
                  >
                    {p}
                  </Button>
                </span>
              ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
