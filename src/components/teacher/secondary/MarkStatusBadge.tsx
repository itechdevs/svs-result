import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Send, Lock } from "lucide-react";
import type { MarksStatus } from "@/types/secondary-marks";

interface MarkStatusBadgeProps {
  status: MarksStatus;
  className?: string;
  showIcon?: boolean;
}

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: Send,
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  VERIFIED: {
    label: "Verified",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  LOCKED: {
    label: "Locked",
    icon: Lock,
    className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
  },
} as const;

export function MarkStatusBadge({ status, className, showIcon = true }: MarkStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
