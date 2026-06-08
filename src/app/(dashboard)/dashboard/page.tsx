import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import AcademicDashboardCanvas from "@/components/features/AcademicDashboardCanvas";

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
      {/* <div className="flex items-center justify-between pb-2 border-b dark:border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-[#002045] dark:text-white tracking-tight">Result</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Active User: <span className="font-bold text-indigo-700 dark:text-[#9ff5c1]">{session?.user?.name} ({role.toUpperCase()})</span>
          </p>
        </div>
      </div> */}
      <AcademicDashboardCanvas role={role} />
    </div>
  );
}
