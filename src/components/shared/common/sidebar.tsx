"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  ClipboardList,
  PenLine,
  Users,
  ClipboardX,
  Grid2X2,
  Sparkles,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface SidebarProps {
  role?: string;
}

const NAV_ITEMS = [
  { label: "Dashboard Overview", tab: "dashboard", icon: LayoutGrid, adminOnly: false },
  { label: "Evaluations Plan", tab: "evaluations", icon: ClipboardList, adminOnly: false },
  { label: "Marking Center", tab: "mark-entry", icon: PenLine, adminOnly: false, teacherOnly: true },
  { label: "Student Records", tab: "student-records", icon: Users, adminOnly: false },
  { label: "Re-Exam Panel", tab: "re-exam-portal", icon: ClipboardX, adminOnly: false, teacherOnly: true },
  { label: "Teacher Allocations", tab: "allocations", icon: Grid2X2, adminOnly: true },
  { label: "Result Compilation", tab: "result-compilation", icon: Sparkles, adminOnly: false },
] as const;

export function Sidebar({ role = "teacher" }: SidebarProps) {
  const pathname = usePathname();
  // Extract current tab from pathname
  // "/" -> dashboard, "/evaluations" -> evaluations
  const pathParts = pathname.split('/dashboard').filter(Boolean);
  const currentTab = pathParts.length === 0 ? "dashboard" : pathParts[0];
  const isAdmin = role === "admin";
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if ('teacherOnly' in item && item.teacherOnly && isAdmin) return false;
    return true;
  });

  const SidebarContent = (
    <aside
      className={cn(
        "h-full flex flex-col shrink-0 select-none transition-all duration-300",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-md",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Section Label */}
      <div
        className={cn(
          "pt-6 pb-3 border-b border-sidebar-border",
          isCollapsed ? "px-2 text-center" : "px-6"
        )}
      >
        <p className="text-[9.5px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.12em] whitespace-nowrap overflow-hidden">
          {isCollapsed ? "AP" : "Academic Portal"}
        </p>
      </div>

      {/* Navigation */}
      <nav
        className={cn("flex-1 py-3 flex flex-col gap-0.5", isCollapsed ? "px-2" : "px-3")}
        aria-label="Sidebar navigation"
      >
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.tab ||
            (item.tab === "evaluations" && currentTab === "create-evaluation");
          const isFirstAdminItem = item.tab === "allocations";

          return (
            <div key={item.tab}>
              {isFirstAdminItem && isAdmin && (
                <div className="h-px bg-sidebar-border mx-1 my-2" />
              )}
              <Link
                href={item.tab === "dashboard"
                  ? "/"
                  : `/${item.tab}`
                }
                className={cn(
                  "group relative flex items-center gap-3 py-2.5 rounded-lg border transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-primary border-primary/20 text-primary-foreground shadow-sm"
                    : "border-transparent hover:bg-sidebar-accent hover:border-sidebar-border/50 text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  isCollapsed ? "px-2 justify-center" : "px-3"
                )}
                title={item.label}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                {/* Icon Box */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
                    isActive
                      ? "bg-primary-foreground/15"
                      : "bg-sidebar-foreground/5 group-hover:bg-sidebar-foreground/10"
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={2}
                    className={cn(
                      "transition-colors duration-200",
                      isActive
                        ? "text-primary-foreground"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                    )}
                  />
                </div>

                {/* Label */}
                {!isCollapsed && (
                  <span
                    className={cn(
                      "text-[13px] transition-colors duration-200 whitespace-nowrap",
                      isActive ? "font-semibold" : "font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                )}

                {/* Active indicator */}
                {isActive && !isCollapsed && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground/70" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "p-3 border-t border-sidebar-border space-y-3",
          isCollapsed && "flex flex-col items-center"
        )}
      >
        <div className={cn("flex items-center gap-2.5", isCollapsed ? "justify-center" : "px-1")}>
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden border border-sidebar-border shrink-0">
            <img
              src={
                isAdmin
                  ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80"
                  : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
              }
              alt="Avatar"
              className="object-cover w-full h-full"
            />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-[12.5px] font-semibold text-sidebar-foreground truncate">
                {isAdmin ? "A. Portal Executive" : "Prof. Henderson"}
              </p>
              <p className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-[0.08em]">
                {isAdmin ? "Administrator" : "Faculty Teacher"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 border-none bg-transparent w-[260px] [&>button]:hidden">
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <SheetDescription className="sr-only">Navigation sidebar</SheetDescription>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return SidebarContent;
}
