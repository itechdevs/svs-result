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
  Plus,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role = "teacher" }: SidebarProps) {
  const pathname = usePathname();
  const currentTab = pathname === "/dashboard" ? "dashboard" : pathname.split('/').pop() || "dashboard";
  const isAdmin = role === "admin";
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const navItems = [
    { label: "Dashboard Overview", tab: "dashboard", icon: LayoutGrid, visible: true },
    { label: "Evaluations Plan", tab: "evaluations", icon: ClipboardList, visible: true },
    { label: "Marking Center", tab: "mark-entry", icon: PenLine, visible: true },
    { label: "Student Records", tab: "student-records", icon: Users, visible: true },
    { label: "Re-Exam Panel", tab: "re-exam-portal", icon: ClipboardX, visible: true },
    { label: "Teacher Allocations", tab: "allocations", icon: Grid2X2, visible: isAdmin },
    { label: "Result Compilation", tab: "result-compilation", icon: Sparkles, visible: isAdmin },
  ];

  const SidebarContent = (
    <aside className={cn(
      "min-h-[calc(100vh-3.5rem)] flex flex-col text-white z-20 shrink-0 select-none transition-all duration-300",
      "bg-gradient-to-b from-[#0a1628] to-[#0d1e38] border-r border-[#63a0ff]/10 shadow-[0_0_60px_rgba(0,0,0,0.5)]",
      isCollapsed && !isMobile ? "w-[72px]" : "w-[260px]",
      isMobile && !openMobile ? "hidden" : "flex"
    )}>

      {/* Section Label */}
      <div className={cn("pt-6 pb-3 border-b border-[#63a0ff]/[0.08]", isCollapsed && !isMobile ? "px-2 text-center" : "px-6")}>
        <p className="text-[9.5px] font-semibold text-[#63a0ff]/40 uppercase tracking-[0.12em] whitespace-nowrap overflow-hidden">
          {isCollapsed && !isMobile ? "AP" : "Academic Portal"}
        </p>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-3 flex flex-col gap-0.5", isCollapsed && !isMobile ? "px-2" : "px-3")} aria-label="Sidebar navigation">
        {navItems.filter((item) => item.visible).map((item, index) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.tab ||
            (item.tab === "evaluations" && currentTab === "create-evaluation");

          // Divider before admin-only items
          const isFirstAdminItem = item.tab === "allocations";

          return (
            <div key={item.tab}>
              {isFirstAdminItem && isAdmin && (
                <div className="h-px bg-[#63a0ff]/[0.07] mx-1 my-2" />
              )}
              <Link
                href={item.tab === "dashboard" 
                  ? (isAdmin ? "/admin/dashboard" : "/") 
                  : (isAdmin ? `/admin/dashboard?tab=${item.tab}` : `/?tab=${item.tab}`)
                }
                className={cn(
                  "group relative flex items-center gap-3 py-2.5 rounded-[10px] border transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-[#3b82f6]/[0.14] border-[#63a0ff]/[0.22]"
                    : "border-transparent hover:bg-[#3b82f6]/[0.08] hover:border-[#63a0ff]/10",
                  isCollapsed && !isMobile ? "px-2 justify-center" : "px-3"
                )}
                title={item.label}
                onClick={() => isMobile && setOpenMobile(false)}
              >
                {/* Icon Box */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                    isActive
                      ? "bg-[#9ff5c1]/15"
                      : "bg-white/[0.04] group-hover:bg-[#3b82f6]/12"
                  )}
                >
                  <Icon
                    size={16}
                    strokeWidth={1.8}
                    className={cn(
                      "transition-colors duration-200",
                      isActive
                        ? "text-[#9ff5c1]"
                        : "text-[#86a0cd]/70 group-hover:text-[#93c5fd]/90"
                    )}
                  />
                </div>

                {/* Label */}
                {(!isCollapsed || isMobile) && (
                  <span
                    className={cn(
                      "text-[13px] transition-colors duration-200 whitespace-nowrap",
                      isActive
                        ? "text-[#e2f9ed] font-semibold"
                        : "text-[#86a0cd]/80 font-medium group-hover:text-[#dbeafe]/95"
                    )}
                  >
                    {item.label}
                  </span>
                )}

                {/* Active dot */}
                {isActive && (!isCollapsed || isMobile) && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#9ff5c1] shadow-[0_0_6px_#9ff5c1]" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("p-3 border-t border-[#63a0ff]/[0.08] bg-black/[0.18] space-y-3", isCollapsed && !isMobile ? "flex flex-col items-center" : "")}>
        {/* User Row */}
        <div className={cn("flex items-center gap-2.5", isCollapsed && !isMobile ? "justify-center" : "px-1")}>
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden border-[1.5px] border-[#63a0ff]/20 shrink-0">
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
          {(!isCollapsed || isMobile) && (
            <div className="overflow-hidden">
              <p className="text-[12.5px] font-semibold text-[#dbeafe] truncate">
                {isAdmin ? "A. Portal Executive" : "Prof. Henderson"}
              </p>
              <p className="text-[10px] font-semibold text-[#63a0ff]/50 uppercase tracking-[0.08em]">
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