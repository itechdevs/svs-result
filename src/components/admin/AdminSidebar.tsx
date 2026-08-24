"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Grid2X2,
  BookOpen,
  Calendar,
  X,
  LogOut,
  ChevronDown,
  MessageSquareText,
  Layers,
  GraduationCap,
  School,
  FlaskConical,
  Users,
  Building,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useProfile } from "@/hooks/use-profile";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";

// A nav child can optionally carry a `category` key that is matched
// against the ?category= search param for active-state detection.
type NavChild = {
  label: string;
  href: string;
  category?: string;
  sectionHeader?: undefined;
};

interface NavSubSection {
  label: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  children: NavChild[];
  section: true;
}

interface NavItemLink {
  label: string;
  href: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  children?: NavChild[];
}

type NavItem = NavItemLink | NavSubSection;

function isSubSection(item: NavItem): item is NavSubSection {
  return "section" in item && item.section === true;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard Overview",
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutGrid,
  },
  {
    label: "Academic Years",
    href: "/admin/academic-years",
    icon: Calendar,
  },
  {
    label: "Grade Levels",
    href: "/admin/grade-levels",
    icon: Layers,
  },
  {
    label: "Synced Students",
    href: ROUTES.ADMIN_SYNCED_STUDENTS,
    icon: Users,
  },
  {
    label: "Pre-Primary",
    icon: GraduationCap,
    section: true,
    children: [
      { label: "Observations & Feedback", href: ROUTES.ADMIN_OBSERVATIONS },
      {
        label: "Exam Plan",
        href: `${ROUTES.ADMIN_EXAMS}?category=PRE_PRIMARY`,
        category: "PRE_PRIMARY",
      },
    ],
  },
  {
    label: "Primary",
    icon: School,
    section: true,
    children: [
      {
        label: "Exam Plan",
        href: `${ROUTES.ADMIN_EXAMS}?category=PRIMARY`,
        category: "PRIMARY",
      },
    ],
  },
  {
    label: "Secondary",
    icon: FlaskConical,
    section: true,
    children: [
      {
        label: "Exam Plan",
        href: `${ROUTES.ADMIN_EXAMS}?category=SECONDARY`,
        category: "SECONDARY",
      },
      { label: "Subject Configs", href: ROUTES.ADMIN_SECONDARY_SUBJECT_CONFIG },
      {
        label: "Mark Verification",
        href: "/admin/secondary/mark-verification",
      },
      {
        label: "Result Compilation",
        href: ROUTES.ADMIN_SECONDARY_RESULT_COMPILATION,
      },
    ],
  },
  {
    label: "Teacher Allocation",
    href: ROUTES.ADMIN_ALLOCATIONS,
    icon: Grid2X2,
  },
  {
    label: "School Information",
    href: ROUTES.ADMIN_SCHOOL_INFORMATION,
    icon: Building,
  },
];

// ── Animated collapsible wrapper ──────────────────────────────────────────────
function AnimatedCollapse({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    if (isOpen) {
      setHeight(ref.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        height: `${height}px`,
        overflow: "hidden",
        transition: "height 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "";
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: profile } = useProfile();

  // Returns true when a nav child's link matches the current page.
  const isChildItemActive = (child: NavChild) => {
    if (child.category) {
      return (
        pathname === ROUTES.ADMIN_EXAMS && currentCategory === child.category
      );
    }
    return pathname === child.href;
  };

  // Find the label of the section that contains the currently active child
  const getActiveSection = (): string | null => {
    for (const item of NAV_ITEMS) {
      if (isSubSection(item)) {
        if (item.children.some(isChildItemActive)) return item.label;
      } else if (item.children) {
        if (item.children.some((c) => pathname === c.href)) return item.label;
      }
    }
    return null;
  };

  const [expandedSection, setExpandedSection] = useState<string | null>(
    () => getActiveSection() ?? "Secondary",
  );

  // Keep active section expanded when route changes
  useEffect(() => {
    const active = getActiveSection();
    if (active) setExpandedSection(active);
  }, [pathname, currentCategory]);

  // Accordion: toggle — if clicking the already-open section, close it
  const toggleSection = (label: string) => {
    setExpandedSection((prev) => (prev === label ? null : label));
  };

  // ── Render a sub-section (accordion parent) ─────────────────────────────────
  const renderSubSection = (item: NavSubSection) => {
    const Icon = item.icon;
    const isExpanded = expandedSection === item.label;
    const isSectionChildActive = item.children.some(isChildItemActive);

    return (
      <div key={item.label} className="relative">
        {/* Left accent bar for active parent */}
        {isSectionChildActive && !isCollapsed && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-sidebar-primary" />
        )}

        <button
          onClick={() => toggleSection(item.label)}
          className={cn(
            "w-full group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 text-left",
            isSectionChildActive
              ? "bg-sidebar-primary/10 text-sidebar-foreground"
              : "hover:bg-sidebar-accent/60 text-sidebar-foreground/60 hover:text-sidebar-foreground",
            isCollapsed ? "px-2 justify-center" : "px-3",
          )}
          title={item.label}
        >
          {/* Icon */}
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
              isSectionChildActive
                ? "bg-sidebar-primary/15"
                : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10",
            )}
          >
            <Icon
              size={15}
              strokeWidth={isSectionChildActive ? 2 : 1.7}
              className={cn(
                "transition-colors duration-200",
                isSectionChildActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/45 group-hover:text-sidebar-primary/70",
              )}
            />
          </div>

          {!isCollapsed && (
            <>
              <span
                className={cn(
                  "text-[12.5px] tracking-[0.01em] transition-colors duration-200 whitespace-nowrap flex-1 text-left",
                  isSectionChildActive
                    ? "font-semibold text-sidebar-foreground"
                    : "font-medium",
                )}
              >
                {item.label}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 shrink-0 transition-transform duration-250 ease-in-out",
                  isExpanded ? "rotate-180" : "rotate-0",
                  isSectionChildActive
                    ? "text-sidebar-foreground/60"
                    : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50",
                )}
              />
            </>
          )}
        </button>

        {!isCollapsed && (
          <AnimatedCollapse isOpen={isExpanded}>
            <div className="pt-0.5 pb-1 pl-[42px] pr-1 flex flex-col gap-0.5">
              {/* Connector line */}
              <div className="relative">
                <span className="absolute left-[-16px] top-0 bottom-2 w-[1px] bg-sidebar-border/60" />
                {item.children.map((child) => {
                  const active = isChildItemActive(child);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "relative flex items-center gap-2 py-[7px] px-3 rounded-md transition-all duration-150 text-[12px]",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 font-medium",
                      )}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      {/* Small dot indicator */}
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-150",
                          active
                            ? "bg-sidebar-primary"
                            : "bg-sidebar-foreground/20 group-hover:bg-sidebar-foreground/40",
                        )}
                      />
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </AnimatedCollapse>
        )}
      </div>
    );
  };

  // ── Render a standard nav link (possibly with children) ────────────────────
  const renderLink = (item: NavItemLink) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSection === item.label;

    const isActive =
      pathname === item.href ||
      (item.href === ROUTES.ADMIN_EXAMS &&
        pathname.startsWith("/admin/exams"));

    const isChildActive =
      hasChildren &&
      item.children!.some((child) => pathname === child.href);

    const isHighlighted = isActive || isChildActive;

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.href} className="relative">
          {isHighlighted && (
            <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-sidebar-primary" />
          )}
          <div className="flex items-stretch gap-1">
            <Link
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 flex-1 px-3",
                isHighlighted
                  ? "bg-sidebar-primary/10 text-sidebar-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/60 hover:text-sidebar-foreground",
              )}
              title={item.label}
              onClick={() => isMobile && setOpenMobile(false)}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                  isHighlighted
                    ? "bg-sidebar-primary/15"
                    : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10",
                )}
              >
                <Icon
                  size={15}
                  strokeWidth={isHighlighted ? 2 : 1.7}
                  className={cn(
                    "transition-colors duration-200",
                    isHighlighted
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/45 group-hover:text-sidebar-primary/70",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[12.5px] tracking-[0.01em] transition-colors duration-200 whitespace-nowrap flex-1 text-left",
                  isHighlighted ? "font-semibold text-sidebar-foreground" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </Link>
            <button
              onClick={() => toggleSection(item.label)}
              className={cn(
                "flex items-center justify-center w-9 rounded-lg transition-all duration-200",
                isHighlighted
                  ? "text-sidebar-foreground/60 hover:bg-sidebar-accent/60"
                  : "text-sidebar-foreground/30 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/40",
              )}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-250 ease-in-out",
                  isExpanded ? "rotate-180" : "rotate-0",
                )}
              />
            </button>
          </div>

          <AnimatedCollapse isOpen={isExpanded}>
            <div className="pt-0.5 pb-1 pl-[42px] pr-1 flex flex-col gap-0.5">
              {item.children!.map((child) => {
                const active = pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "relative flex items-center gap-2 py-[7px] px-3 rounded-md transition-all duration-150 text-[12px]",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                        : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 font-medium",
                    )}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-150",
                        active ? "bg-sidebar-primary" : "bg-sidebar-foreground/20",
                      )}
                    />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </AnimatedCollapse>
        </div>
      );
    }

    return (
      <div key={item.href} className="relative">
        {isActive && !isCollapsed && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-sidebar-primary" />
        )}
        <Link
          href={item.href}
          className={cn(
            "group relative flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 overflow-hidden",
            isActive
              ? "bg-sidebar-primary/10 text-sidebar-foreground"
              : "hover:bg-sidebar-accent/60 text-sidebar-foreground/60 hover:text-sidebar-foreground",
            isCollapsed ? "px-2 justify-center" : "px-3",
          )}
          title={item.label}
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
              isActive
                ? "bg-sidebar-primary/15"
                : "bg-sidebar-foreground/5 group-hover:bg-sidebar-primary/10",
            )}
          >
            <Icon
              size={15}
              strokeWidth={isActive ? 2 : 1.7}
              className={cn(
                "transition-colors duration-200",
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/45 group-hover:text-sidebar-primary/70",
              )}
            />
          </div>
          {!isCollapsed && (
            <span
              className={cn(
                "text-[12.5px] tracking-[0.01em] transition-colors duration-200 whitespace-nowrap",
                isActive ? "font-semibold text-sidebar-foreground" : "font-medium",
              )}
            >
              {item.label}
            </span>
          )}
        </Link>
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
      {/* ── Header (mobile close button only) ─────────────────────────────── */}
      {isMobile && (
        <div className="pt-4 pb-2 px-3 flex justify-end shrink-0">
          <button
            onClick={() => setOpenMobile(false)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav
        className={cn(
          "flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto",
          "scrollbar-thin scrollbar-thumb-sidebar-border/50 scrollbar-track-transparent",
          isCollapsed ? "px-2" : "px-3",
        )}
        aria-label="Admin navigation"
      >
        {!isCollapsed && (
          <p className="px-3 pb-2 pt-1 text-[9.5px] font-semibold text-sidebar-foreground/30 uppercase tracking-[0.15em]">
            Main Menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          if (isSubSection(item)) return renderSubSection(item);
          return renderLink(item as NavItemLink);
        })}
      </nav>

      {/* ── User footer ────────────────────────────────────────────────────── */}
      <div className="relative border-t border-sidebar-border shrink-0">
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div
              className={cn(
                "absolute bottom-[110%] z-50 rounded-lg border border-border bg-popover p-1 shadow-lg",
                isCollapsed ? "left-2 w-14" : "left-3 right-3",
              )}
            >
              <button
                onClick={async () => {
                  toast.success("Signed out successfully");
                  await signOut({ callbackUrl: ROUTES.LOGIN });
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md py-2 text-[12.5px] text-destructive hover:bg-destructive/8 transition-colors",
                  isCollapsed ? "justify-center px-0" : "px-3",
                )}
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                {!isCollapsed && <span className="font-medium">Sign out</span>}
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-3 hover:bg-sidebar-accent/70 transition-colors text-left",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-sidebar-primary/30 shrink-0 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold text-[11px]">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-tight">
                {profile?.name || "Administrator"}
              </p>
              <p className="text-[9.5px] font-medium text-sidebar-foreground/40 uppercase tracking-[0.08em] truncate mt-0.5">
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
        <SheetContent
          side="left"
          className="p-0 border-none bg-transparent w-[260px] [&>button]:hidden"
        >
          <SheetTitle className="sr-only">Admin Sidebar</SheetTitle>
          <SheetDescription className="sr-only">
            Admin navigation sidebar
          </SheetDescription>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return SidebarContent;
}
