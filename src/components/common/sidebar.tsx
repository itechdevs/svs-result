"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
  // Add more nav items here
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar md:flex md:flex-col">
      <nav className="flex flex-col gap-1 p-3" aria-label="Sidebar navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
