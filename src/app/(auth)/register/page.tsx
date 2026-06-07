import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground text-sm">
            Get started for free today
          </p>
        </div>

        {/* Replace with your RegisterForm component */}
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground text-center">
            Add your RegisterForm component here.
          </p>
        </div>
      </div>
    </main>
  );
}
