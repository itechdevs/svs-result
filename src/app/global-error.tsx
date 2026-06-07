"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (e.g., Sentry)
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
