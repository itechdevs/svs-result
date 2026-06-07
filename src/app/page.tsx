import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES, APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Your B.L.A.S.T. Next.js boilerplate is ready. Fill in your North Star
        in <code className="font-mono text-sm">project.md</code> and start
        building.
      </p>
      <div className="flex gap-4">
        <Link
          href={ROUTES.LOGIN}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
        <Link
          href={ROUTES.REGISTER}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
