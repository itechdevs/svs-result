"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { linkedApps } from "@/lib/constants/linked-apps";

export function AppSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <LayoutGrid className="h-4 w-4" />
          <span className="sr-only">Switch app</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Switch to
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {linkedApps.map((app) => {
          const Icon = app.icon;
          return (
            <DropdownMenuItem key={app.url} asChild>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded border">
                  <Icon className="h-4 w-4" />
                </div>
                <span>{app.label}</span>
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
