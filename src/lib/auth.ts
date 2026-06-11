// Legacy auth helpers - migrated to NextAuth v5
// Use src/lib/rbac.ts for new auth helpers (requireAuth, requireRole)
// This file is kept for backward compatibility with existing code

import { auth } from "@/auth";

export async function getSession() {
  const session = await auth();
  return session?.user || null;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) throw new AuthError("Unauthorized");
  return user;
}

export async function requireRole(...roles: Array<"ADMIN" | "TEACHER">) {
  const user = await requireSession();
  if (!roles.includes(user.role as "ADMIN" | "TEACHER")) {
    throw new ForbiddenError("Forbidden");
  }
  return user;
}

export class AuthError extends Error {}
export class ForbiddenError extends Error {}
