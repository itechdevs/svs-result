import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { Navbar } from "@/components/common/navbar";
import { Sidebar as AppSidebar } from "@/components/common/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth decryption failed:", error);
  }

  // Belt-and-suspenders auth guard (middleware handles the primary guard)
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col w-full overflow-hidden">
        <Navbar user={session.user} />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar role={session.user.role} />
          <SidebarInset className="flex-1 overflow-y-auto p-6 bg-transparent">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
