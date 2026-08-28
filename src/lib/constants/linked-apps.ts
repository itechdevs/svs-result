import { LayoutDashboard, GraduationCap, BookOpen, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const linkedApps: {
  label: string;
  url: string;
  icon: LucideIcon;
}[] = [
    {
      label: "School Dashboard",
      url: "https://dashboard.svs.edu.np/",
      icon: LayoutDashboard,
    },
    {
      label: "Billing",
      url: "https://billing.svs.edu.np/",
      icon: Wallet,
    },
    // {
    //   label: "Result",
    //   url: "https://result.svs.edu.np/",
    //   icon: GraduationCap,
    // },
    {
      label: "Library",
      url: "https://library.svs.edu.np/",
      icon: BookOpen,
    },
  ];
