import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "@/components/common/user-menu";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
// import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface NavbarProps {
  user: {
    image?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  const dashboardHref =
    user.role === "admin" ? ROUTES.ADMIN_DASHBOARD : ROUTES.TEACHER_DASHBOARD;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        <SidebarTrigger className="mr-4" />
        <Link href={dashboardHref} className="mr-6 flex items-center space-x-2 font-semibold">
          <span>{APP_NAME}</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button> */}
          <ThemeToggle />

          <div className="flex items-center gap-3 ml-2 pl-2 border-l border-border">
            <UserMenu user={user} />
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-primary">{user.name || "User"}</span>
              <span className="text-sm font-semibold text-foreground capitalize">{user.role || "Teacher"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
