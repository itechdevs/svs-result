"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, ClipboardList, ClipboardX, ChevronDown, X } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/shared/ui/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/shared/ui/sheet";
import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

const NAV_ITEMS: { label: string; href: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; hasSubMenu?: boolean }[] = [
  { label: "Teacher Dashboard", href: ROUTES.TEACHER_DASHBOARD, icon: LayoutGrid },
  { label: "Evaluation Plan", href: ROUTES.TEACHER_EVALUATIONS, icon: ClipboardList, hasSubMenu: true },
  { label: "Re-Exam Panel", href: ROUTES.TEACHER_RE_EXAM, icon: ClipboardX },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [evaluationsExpanded, setEvaluationsExpanded] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { data: profile } = useProfile();

  const assignedPairs = useMemo(() => {
    const subjects = profile?.syncedTeacher?.subjects ?? [];
    if (process.env.NODE_ENV === 'development' && subjects.length === 0 && profile?.role === 'TEACHER') {
      console.warn(
        '[TeacherSidebar] No subjects found for teacher.',
        'syncedTeacher:', profile?.syncedTeacher ? 'present' : 'null',
        'subjects count:', subjects.length,
      );
    }
    return subjects.map(s => ({ className: s.gradeLevel, subject: s.name }));
  }, [profile]);

  const SidebarContent = (
    <aside
      className={cn(
        "h-full flex flex-col shrink-0 select-none transition-all duration-300",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-md",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className={cn("pt-6 pb-3 border-b border-sidebar-border flex items-center justify-between", isCollapsed ? "px-2 text-center" : "px-6")}>
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

      <nav className={cn("flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto", isCollapsed ? "px-2" : "px-3")} aria-label="Teacher navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === ROUTES.TEACHER_EVALUATIONS && (
              pathname === "/teacher/create-evaluation" ||
              pathname.startsWith("/teacher/edit-evaluation") ||
              pathname.startsWith(ROUTES.TEACHER_MARK_ENTRY) ||
              pathname.startsWith("/teacher/result-compilation")
            )) ||
            (item.href === ROUTES.TEACHER_RE_EXAM && pathname.startsWith(ROUTES.TEACHER_RE_EXAM));

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (item.hasSubMenu && !isCollapsed) {
                    e.preventDefault();
                    setEvaluationsExpanded(!evaluationsExpanded);
                  }
                  if (isMobile && !item.hasSubMenu) setOpenMobile(false);
                }}
                className={cn(
                  "group relative flex items-center gap-3 py-2.5 rounded-lg border transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground"
                    : "border-transparent hover:bg-sidebar-accent/60 hover:border-sidebar-border/50 text-sidebar-foreground/70 hover:text-sidebar-foreground",
                  isCollapsed ? "px-2 justify-center" : "px-3"
                )}
                title={item.label}
              >
                <div className={cn(
                  "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
                  isActive ? "bg-sidebar-primary/20" : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10"
                )}>
                  <Icon size={16} strokeWidth={1.8} className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary/80"
                  )} />
                </div>
                {!isCollapsed && (
                  <span className={cn("text-[13px] transition-colors duration-200 whitespace-nowrap", isActive ? "font-semibold" : "font-medium")}>
                    {item.label}
                  </span>
                )}
                {item.hasSubMenu && !isCollapsed && (
                  <ChevronDown size={14} className={cn("ml-auto transition-transform", evaluationsExpanded && "rotate-180")} />
                )}
                {isActive && !isCollapsed && !item.hasSubMenu && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                )}
              </Link>

              {/* Submenu for Evaluations */}
              {item.hasSubMenu && !isCollapsed && evaluationsExpanded && (
                <div className="mt-1 ml-11 space-y-1">
                  {assignedPairs.map(({ className, subject }) => {
                    const params = new URLSearchParams({ class: className, subject });
                    const href = `${ROUTES.TEACHER_EVALUATIONS}?${params}`;
                    const isSubActive =
                      searchParams.get('class') === className &&
                      searchParams.get('subject') === subject &&
                      (
                        pathname === ROUTES.TEACHER_EVALUATIONS ||
                        pathname.startsWith(ROUTES.TEACHER_MARK_ENTRY) ||
                        pathname.startsWith("/teacher/result-compilation")
                      );
                    return (
                      <Link
                        key={`${className}-${subject}`}
                        href={href}
                        onClick={() => isMobile && setOpenMobile(false)}
                        className={cn(
                          "block relative py-1.5 px-3 text-[11px] rounded transition-colors pr-6",
                          isSubActive
                            ? "bg-sidebar-accent/60 text-sidebar-foreground"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40"
                        )}
                      >
                        <div className="font-medium">{className}</div>
                        <div className="text-[10px] text-sidebar-foreground/40">{subject}</div>
                        {isSubActive && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="relative border-t border-sidebar-border">
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className={cn(
              "absolute bottom-[110%] z-50 rounded-md border border-border bg-popover p-1 shadow-md",
              isCollapsed ? "left-2 w-12" : "left-3 right-3"
            )}>
              <button
                onClick={async () => {
                  toast.success("Signed out successfully");
                  await signOut({ callbackUrl: ROUTES.LOGIN });
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm py-2 text-sm text-destructive hover:bg-accent transition-colors",
                  isCollapsed ? "justify-center px-0" : "px-3"
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
            isCollapsed ? "justify-center" : ""
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
                {profile?.role === "ADMIN" ? "Administrator" : "Faculty Teacher"}
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
        <SheetContent side="left" className="p-0 border-none bg-transparent w-[260px] [&>button]:hidden">
          <SheetTitle className="sr-only">Teacher Sidebar</SheetTitle>
          <SheetDescription className="sr-only">Teacher navigation sidebar</SheetDescription>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return SidebarContent;
}
