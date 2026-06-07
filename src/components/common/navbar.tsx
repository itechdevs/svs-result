import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "@/components/common/user-menu";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";

interface NavbarProps {
  user: {
    image?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <Link
          href={ROUTES.DASHBOARD}
          className="mr-6 flex items-center space-x-2 font-semibold"
        >
          <span>{APP_NAME}</span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>

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
