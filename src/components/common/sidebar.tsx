"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role?: string;
}

export function Sidebar({ role = "teacher" }: SidebarProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const isAdmin = role === "admin";

  const navItems = [
    {
      label: "Dashboard Overview",
      tab: "dashboard",
      icon: "dashboard",
      visible: true,
    },
    {
      label: "Evaluations Plan",
      tab: "evaluations",
      icon: "assignment",
      visible: true,
    },
    {
      label: "Marking Center",
      tab: "mark-entry",
      icon: "edit_note",
      visible: true,
    },
    {
      label: "Student Records",
      tab: "student-records",
      icon: "groups",
      visible: true,
    },
    {
      label: "Re-Exam Panel",
      tab: "re-exam-portal",
      icon: "assignment_late",
      visible: true,
    },
    {
      label: "Teacher Allocations",
      tab: "allocations",
      icon: "grid_on",
      visible: isAdmin,
    },
    {
      label: "Result Compilation",
      tab: "result-compilation",
      icon: "auto_awesome",
      visible: isAdmin,
    },
  ];

  return (
    <aside className="w-[260px] min-h-[calc(100vh-3.5rem)] bg-[#002045] flex flex-col text-white z-20 shrink-0 shadow-lg select-none">
      
      {/* Sidebar Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1" aria-label="Sidebar navigation">
        <div className="px-4 text-[10px] font-bold text-[#86a0cd]/60 uppercase tracking-widest mb-2">Academic Portal</div>
        
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = currentTab === item.tab || (item.tab === 'evaluations' && currentTab === 'create-evaluation');
            return (
              <Link
                key={item.tab}
                href={`/dashboard?tab=${item.tab}`}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none text-left border-l-4",
                  isActive
                    ? "bg-[#1a365d] text-[#9ff5c1] border-[#9ff5c1] font-bold"
                    : "text-[#86a0cd] hover:bg-[#1a365d]/40 hover:text-white border-transparent"
                )}
              >
                <span className="material-symbols-outlined text-lg shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Sidebar Footer details */}
      <div className="p-4 border-t border-white/10 space-y-3 bg-[#0d1c2e] text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-400 overflow-hidden shrink-0 border border-white/20">
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
          <div className="overflow-hidden">
            <p className="font-semibold truncate text-white">
              {isAdmin ? "A. Portal Executive" : "Prof. Henderson"}
            </p>
            <p className="text-[10px] truncate text-[#86a0cd] uppercase tracking-wider font-bold">
              {isAdmin ? "Administrator" : "Faculty Teacher"}
            </p>
          </div>
        </div>
        
        <Link
          href="/dashboard?tab=create-evaluation"
          className="w-full bg-[#0a6c44] text-white hover:bg-opacity-95 font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-center"
        >
          <span className="material-symbols-outlined text-xs">add</span>
          <span>New Evaluation</span>
        </Link>
      </div>
    </aside>
  );
}
