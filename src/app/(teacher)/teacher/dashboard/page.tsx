import type { Metadata } from "next";
import TeacherDashboardClient from "@/components/teacher/TeacherDashboardClient";

export const metadata: Metadata = { title: "Teacher Dashboard" };

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <TeacherDashboardClient />
    </div>
  );
}
