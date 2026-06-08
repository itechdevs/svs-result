import type { Metadata } from "next";
import { auth } from "@/services/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";


export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Administrator dashboard for result management system.",
};

export default async function AdminDashboardPage() {
  const session = await auth();

  // Admin-only guard
  if (session?.user?.role !== "admin") {
    redirect(ROUTES.LOGIN);
  }

  return (
    <div className="space-y-6">
      <AdminDashboardClient />
    </div>
  );
}
