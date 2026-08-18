"use client";

import { cn } from "@/lib/utils";
import type { SecondaryComponentType, SecondarySubjectComponent } from "@/types/secondary-marks";
import { BookOpen, FlaskConical, FileText } from "lucide-react";

interface ComponentTabsProps {
  components: SecondarySubjectComponent[];
  activeComponentType: SecondaryComponentType | null;
  onComponentChange: (componentType: SecondaryComponentType) => void;
}

const COMPONENT_CONFIG = {
  THEORY: {
    label: "Theory",
    icon: BookOpen,
    color: "text-purple-600 dark:text-purple-400",
    bgActive: "bg-purple-50 dark:bg-purple-950/20 border-purple-500",
    bgInactive: "hover:bg-purple-50/50 dark:hover:bg-purple-950/10",
  },
  PRACTICAL: {
    label: "Practical",
    icon: FlaskConical,
    color: "text-emerald-600 dark:text-emerald-400",
    bgActive: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500",
    bgInactive: "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10",
  },
} as const;

export function ComponentTabs({
  components,
  activeComponentType,
  onComponentChange,
}: ComponentTabsProps) {
  if (components.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {components
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((component) => {
          const config = COMPONENT_CONFIG[component.type];
          const Icon = config.icon;
          const isActive = activeComponentType === component.type;

          return (
            <button
              key={component.id}
              onClick={() => onComponentChange(component.type)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all",
                "font-medium text-sm",
                isActive
                  ? cn("border-2", config.bgActive, config.color)
                  : cn("border-transparent bg-muted", config.bgInactive, "text-muted-foreground")
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && config.color)} />
              <span>{config.label}</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="font-semibold">{component.fullMarks}</span>
                <span className="text-muted-foreground">FM</span>
              </div>
            </button>
          );
        })}
    </div>
  );
}
