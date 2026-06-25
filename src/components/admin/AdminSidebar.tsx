"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, Grid2X2, BookOpen, Calendar, X, LogOut } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useProfile } from "@/hooks/use-profile";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard Overview", href: ROUTES.ADMIN_DASHBOARD, icon: LayoutGrid },
  { label: "Academic Years", href: "/admin/academic-years", icon: Calendar },
  { label: "Exam Plan", href: ROUTES.ADMIN_EXAMS, icon: BookOpen },
  { label: "Teacher Allocation", href: ROUTES.ADMIN_ALLOCATIONS, icon: Grid2X2 },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: profile } = useProfile();

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
          {isCollapsed ? "AP" : "Admin Portal"}
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

      <nav className={cn("flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto", isCollapsed ? "px-2" : "px-3")} aria-label="Admin navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href === ROUTES.ADMIN_EXAMS && pathname.startsWith("/admin/exams"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 py-2.5 rounded-lg border transition-all duration-200 overflow-hidden",
                isActive
                  ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground"
                  : "border-transparent hover:bg-sidebar-accent/60 hover:border-sidebar-border/50 text-sidebar-foreground/70 hover:text-sidebar-foreground",
                isCollapsed ? "px-2 justify-center" : "px-3"
              )}
              title={item.label}
              onClick={() => isMobile && setOpenMobile(false)}
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
              {isActive && !isCollapsed && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </Link>
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
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <p className="text-[12.5px] font-semibold text-sidebar-foreground truncate leading-tight">
                {profile?.name || "Administrator"}
              </p>
              <p className="text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-[0.05em] truncate mt-0.5">
                Administrator
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
          <SheetTitle className="sr-only">Admin Sidebar</SheetTitle>
          <SheetDescription className="sr-only">Admin navigation sidebar</SheetDescription>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return SidebarContent;
}
