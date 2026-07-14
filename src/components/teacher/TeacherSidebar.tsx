"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ClipboardList,
  ClipboardX,
  ChevronDown,
  X,
  PenLine,
  MessageSquareText,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/shared/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/shared/ui/sheet";
import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useGradeLevelCategories } from "@/hooks/use-grade-level-categories";
import { categorizeGradeLevel } from "@/lib/schemas";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

type SchoolLevelKey = "PRE_PRIMARY" | "PRIMARY" | "SECONDARY" | "HIGHER";

const LEVEL_LABELS: Record<SchoolLevelKey, string> = {
  PRE_PRIMARY: "Pre-Primary Evaluation",
  PRIMARY: "Primary Evaluation",
  SECONDARY: "Secondary Marks Entry",
  HIGHER: "Secondary Marks Entry",
};

type SubjectPair = {
  className: string;
  section: string | null;
  subject: string;
  syncedSubjectId: string;
};

function buildSchoolLevelMap(
  categories: { gradeLevel: string; schoolLevel: string }[],
): Map<string, SchoolLevelKey> {
  const map = new Map<string, SchoolLevelKey>();
  for (const c of categories) {
    map.set(c.gradeLevel, c.schoolLevel as SchoolLevelKey);
  }
  return map;
}

function getSchoolLevel(
  gradeLevel: string,
  dbMap: Map<string, SchoolLevelKey>,
): SchoolLevelKey {
  if (dbMap.has(gradeLevel)) return dbMap.get(gradeLevel)!;
  const fallback = categorizeGradeLevel(gradeLevel);
  if (fallback === "HIGHER") return "HIGHER";
  return fallback as SchoolLevelKey;
}

export function TeacherSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "pre-primary": true,
    primary: true,
    secondary: true,
  });

  const { data: profile } = useProfile();
  const { data: categories } = useGradeLevelCategories();

  const isClassTeacher = !!profile?.syncedTeacher?.classTeacherId;

  const dbMap = useMemo(
    () => buildSchoolLevelMap(categories ?? []),
    [categories],
  );

  const subjectPairs: SubjectPair[] = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    return subjects
      .map((s) => ({
        className: s.gradeLevel,
        section: s.section,
        subject: s.name,
        syncedSubjectId: s.id,
      }))
      .filter(
        (pair, i, arr) =>
          arr.findIndex(
            (p) =>
              p.className === pair.className &&
              p.subject === pair.subject &&
              p.section === pair.section,
          ) === i,
      );
  }, [profile]);

  const groupedPairs = useMemo(() => {
    const groups: Record<SchoolLevelKey, SubjectPair[]> = {
      PRE_PRIMARY: [],
      PRIMARY: [],
      SECONDARY: [],
      HIGHER: [],
    };
    for (const pair of subjectPairs) {
      const level = getSchoolLevel(pair.className, dbMap);
      if (level === "HIGHER") {
        groups.SECONDARY.push(pair);
      } else {
        groups[level].push(pair);
      }
    }
    return groups;
  }, [subjectPairs, dbMap]);

  const hasPrePrimary = groupedPairs.PRE_PRIMARY.length > 0;
  const hasPrimary = groupedPairs.PRIMARY.length > 0;
  const hasSecondary =
    groupedPairs.SECONDARY.length > 0 || groupedPairs.HIGHER.length > 0;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const reExamActive =
    pathname === ROUTES.TEACHER_RE_EXAM ||
    pathname.startsWith(ROUTES.TEACHER_RE_EXAM);

  const isEvalActive = (className: string, section: string | null, subject: string) => {
    const currentClass = searchParams.get("class");
    const currentSection = searchParams.get("section");
    const currentSubject = searchParams.get("subject");
    return (
      currentClass === className &&
      currentSubject === subject &&
      (section ? currentSection === section : !currentSection) &&
      (pathname === ROUTES.TEACHER_EVALUATIONS ||
        pathname === "/teacher/create-evaluation" ||
        pathname.startsWith("/teacher/edit-evaluation") ||
        pathname.startsWith(ROUTES.TEACHER_MARK_ENTRY) ||
        pathname.startsWith("/teacher/result-compilation"))
    );
  };

  const isSectionActive = (pairs: SubjectPair[], linkType: "eval" | "secondary") => {
    if (linkType === "secondary") {
      return pathname.startsWith(ROUTES.TEACHER_SECONDARY_MARK_ENTRY);
    }
    return pairs.some((p) => isEvalActive(p.className, p.section, p.subject)) || reExamActive;
  };

  const renderSection = (
    key: string,
    label: string,
    icon: React.ComponentType<{
      size?: number;
      strokeWidth?: number;
      className?: string;
    }>,
    pairs: SubjectPair[],
    linkType: "eval" | "secondary",
    showObservations: boolean,
    showReExam: boolean,
  ) => {
    const isExpanded = expandedSections[key];
    const active = isSectionActive(pairs, linkType);

    const SectionIcon = icon;

    const buildHref = (pair: SubjectPair) => {
      if (linkType === "secondary") {
        const params = new URLSearchParams({
          gradeLevel: pair.className,
          syncedSubjectId: pair.syncedSubjectId,
        });
        return `${ROUTES.TEACHER_SECONDARY_MARK_ENTRY}?${params}`;
      }
      const params = new URLSearchParams({
        class: pair.className,
        subject: pair.subject,
      });
      if (pair.section) params.set("section", pair.section);
      return `${ROUTES.TEACHER_EVALUATIONS}?${params}`;
    };

    const reExamActive =
      pathname === ROUTES.TEACHER_RE_EXAM ||
      pathname.startsWith(ROUTES.TEACHER_RE_EXAM);

    return (
      <div key={key}>
        <button
          onClick={() => toggleSection(key)}
          className={cn(
            "w-full group relative flex items-center gap-3 py-2.5 rounded-lg border transition-all duration-200 overflow-hidden text-left",
            active
              ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground"
              : "border-transparent hover:bg-sidebar-accent/60 hover:border-sidebar-border/50 text-sidebar-foreground/70 hover:text-sidebar-foreground",
            isCollapsed ? "px-2 justify-center" : "px-3",
          )}
          title={label}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
              active
                ? "bg-sidebar-primary/20"
                : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10",
            )}
          >
            <SectionIcon
              size={16}
              strokeWidth={1.8}
              className={cn(
                "transition-colors duration-200",
                active
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-primary/80",
              )}
            />
          </div>
          {!isCollapsed && (
            <>
              <span
                className={cn(
                  "text-[13px] transition-colors duration-200 whitespace-nowrap flex-1",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {label}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  isExpanded && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {!isCollapsed && isExpanded && (
          <div className="mt-1 ml-11 space-y-1">
            {pairs.map((pair, idx) => {
              const href = buildHref(pair);
              const isSubActive =
                linkType === "secondary"
                  ? false
                  : isEvalActive(pair.className, pair.section, pair.subject);

              return (
                <Link
                  key={`${key}-${pair.className}-${pair.section ?? ""}-${pair.subject}-${idx}`}
                  href={href}
                  onClick={() => isMobile && setOpenMobile(false)}
                  className={cn(
                    "block relative py-1.5 px-3 text-[11px] rounded transition-colors pr-6",
                    isSubActive
                      ? "bg-sidebar-accent/60 text-sidebar-foreground"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                  )}
                >
                  <div className="font-medium">
                    {pair.className}
                    {pair.section ? ` (${pair.section})` : ""}
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/40">
                    {pair.subject}
                  </div>
                  {isSubActive && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              );
            })}

            {showReExam && (
              <Link
                href={ROUTES.TEACHER_RE_EXAM}
                onClick={() => isMobile && setOpenMobile(false)}
                className={cn(
                  "block relative py-1.5 px-3 text-[11px] rounded transition-colors pr-6",
                  reExamActive
                    ? "bg-sidebar-accent/60 text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                )}
              >
                <div className="font-medium flex items-center gap-1.5">
                  <ClipboardX size={12} />
                  Re-Exam Panel
                </div>
                {reExamActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            )}

            {showObservations && isClassTeacher && (
              <Link
                href={ROUTES.TEACHER_OBSERVATIONS}
                onClick={() => isMobile && setOpenMobile(false)}
                className={cn(
                  "block relative py-1.5 px-3 text-[11px] rounded transition-colors pr-6",
                  pathname === ROUTES.TEACHER_OBSERVATIONS
                    ? "bg-sidebar-accent/60 text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                )}
              >
                <div className="font-medium flex items-center gap-1.5">
                  <MessageSquareText size={12} />
                  Observations
                </div>
                {pathname === ROUTES.TEACHER_OBSERVATIONS && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>
            )}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = (
    <aside
      className={cn(
        "h-full flex flex-col shrink-0 select-none transition-all duration-300",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-md",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "pt-6 pb-3 border-b border-sidebar-border flex items-center justify-between",
          isCollapsed ? "px-2 text-center" : "px-6",
        )}
      >
        <p className="text-[9.5px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.12em] whitespace-nowrap overflow-hidden">
          {isCollapsed ? "TP" : "Teacher Portal"}
        </p>
        {isMobile && (
          <button
            onClick={() => setOpenMobile(false)}
            className="p-1 -mr-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav
        className={cn(
          "flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto",
          isCollapsed ? "px-2" : "px-3",
        )}
        aria-label="Teacher navigation"
      >
        {/* Dashboard */}
        <Link
          href={ROUTES.TEACHER_DASHBOARD}
          onClick={() => isMobile && setOpenMobile(false)}
          className={cn(
            "group relative flex items-center gap-3 py-2.5 rounded-lg border transition-all duration-200 overflow-hidden",
            pathname === ROUTES.TEACHER_DASHBOARD
              ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground"
              : "border-transparent hover:bg-sidebar-accent/60 hover:border-sidebar-border/50 text-sidebar-foreground/70 hover:text-sidebar-foreground",
            isCollapsed ? "px-2 justify-center" : "px-3",
          )}
          title="Teacher Dashboard"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
              pathname === ROUTES.TEACHER_DASHBOARD
                ? "bg-sidebar-primary/20"
                : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10",
            )}
          >
            <LayoutGrid
              size={16}
              strokeWidth={1.8}
              className={cn(
                "transition-colors duration-200",
                pathname === ROUTES.TEACHER_DASHBOARD
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/50 group-hover:text-sidebar-primary/80",
              )}
            />
          </div>
          {!isCollapsed && (
            <span
              className={cn(
                "text-[13px] transition-colors duration-200 whitespace-nowrap",
                pathname === ROUTES.TEACHER_DASHBOARD
                  ? "font-semibold"
                  : "font-medium",
              )}
            >
              Teacher Dashboard
            </span>
          )}
        </Link>

        {/* Pre-Primary Evaluation */}
        {hasPrePrimary &&
          renderSection(
            "pre-primary",
            "Pre-Primary Evaluation",
            ClipboardList,
            groupedPairs.PRE_PRIMARY,
            "eval",
            true,
            true,
          )}

        {/* Primary Evaluation */}
        {hasPrimary &&
          renderSection(
            "primary",
            "Primary Evaluation",
            ClipboardList,
            groupedPairs.PRIMARY,
            "eval",
            false,
            true,
          )}

        {/* Secondary Marks Entry */}
        {hasSecondary &&
          renderSection(
            "secondary",
            "Secondary Marks Entry",
            PenLine,
            [...groupedPairs.SECONDARY, ...groupedPairs.HIGHER],
            "secondary",
            false,
            false,
          )}
      </nav>

      <div className="relative border-t border-sidebar-border">
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              className={cn(
                "absolute bottom-[110%] z-50 rounded-md border border-border bg-popover p-1 shadow-md",
                isCollapsed ? "left-2 w-12" : "left-3 right-3",
              )}
            >
              <button
                onClick={async () => {
                  toast.success("Signed out successfully");
                  await signOut({ callbackUrl: ROUTES.LOGIN });
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm py-2 text-sm text-destructive hover:bg-accent transition-colors",
                  isCollapsed ? "justify-center px-0" : "px-3",
                )}
                title="Sign out"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>Sign out</span>}
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-3 hover:bg-sidebar-accent transition-colors text-left",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-sidebar-border shrink-0 bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "T"}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <p className="text-[12.5px] font-semibold text-sidebar-foreground truncate leading-tight">
                {profile?.name || "Teacher"}
              </p>
              <p className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-[0.05em] truncate mt-0.5">
                {profile?.role === "ADMIN"
                  ? "Administrator"
                  : "Faculty Teacher"}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="p-0 border-none bg-transparent w-[260px] [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Teacher Sidebar</SheetTitle>
          <SheetDescription className="sr-only">
            Teacher navigation sidebar
          </SheetDescription>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return SidebarContent;
}
