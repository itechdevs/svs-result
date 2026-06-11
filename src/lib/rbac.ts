import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type UserRole = "ADMIN" | "TEACHER";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role as UserRole)) {
    redirect("/unauthorized");
  }
  return user;
}

export function hasRole(userRole: string, ...allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function isTeacher(role: string): boolean {
  return role === "TEACHER";
}
