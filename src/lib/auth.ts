import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { User, UserRole } from "@prisma/client";

export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "isActive" | "syncedTeacherId"
>;

const SESSION_COOKIE = "result_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          syncedTeacherId: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  if (!session.user.isActive) return null;

  return session.user;
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new AuthError("Unauthorized");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!roles.includes(user.role)) throw new ForbiddenError("Forbidden");
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const { randomBytes } = await import("crypto");
  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function destroySession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export function setSessionCookie(token: string) {
  // Returned as a header string; caller injects into NextResponse
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${
    SESSION_DURATION_MS / 1000
  }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export class AuthError extends Error {}
export class ForbiddenError extends Error {}
