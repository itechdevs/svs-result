"use client";

import { useSession } from "next-auth/react";

/**
 * Returns the current authenticated user from the session.
 * Use in Client Components only.
 * For Server Components, use `auth()` from "@/lib/auth" directly.
 */
export function useCurrentUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
