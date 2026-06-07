import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { Navbar } from "@/components/common/navbar";
import { Sidebar } from "@/components/common/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Belt-and-suspenders auth guard (middleware handles the primary guard)
  if (!session?.user) {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={session.user} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
