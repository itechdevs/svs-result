import type { Metadata } from "next";
import { auth } from "@/services/auth";
import AcademicDashboardCanvas from "@/components/shared/AcademicDashboardCanvas";

export const metadata: Metadata = {
  title: "Dashboard - School Result Management System",
  description: "Teacher and administrator marks entry and result generation portal.",
};

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch (e) {
    // Let layout handle the redirect
  }
  const role = session?.user?.role || "teacher";

  return (
    <div className="space-y-6">
      <AcademicDashboardCanvas role={role} />
    </div>
  );
}
