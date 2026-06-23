import { redirect } from "next/navigation";
import { auth } from "@/services/auth";
import { ROUTES } from "@/lib/constants";
import { Navbar } from "@/components/shared/common/navbar";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("Auth decryption failed:", error);
  }

  if (!session?.user) redirect(ROUTES.LOGIN);
  if (session.user.role !== "TEACHER") redirect(ROUTES.ADMIN_DASHBOARD);

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden flex flex-col w-full">
        <Navbar user={session.user} />
        <div className="flex flex-1 overflow-hidden">
          <TeacherSidebar />
          <SidebarInset className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-transparent">
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
