import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name ?? "there"}!
        </p>
      </div>

      {/* Add your dashboard widgets here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Add metric cards here
          </p>
        </div>
      </div>
    </div>
  );
}
