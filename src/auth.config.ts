import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logLoginAttempt } from "@/services/audit-service";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        const { email, password } = loginSchema.parse(credentials);
        
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !user.isActive) {
          await logLoginAttempt(email, false, "Invalid credentials", req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip"), req.headers?.get("user-agent"));
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await logLoginAttempt(email, false, "Invalid credentials", req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip"), req.headers?.get("user-agent"));
          return null;
        }

        if (!user.emailVerified) {
          await logLoginAttempt(email, false, "Email not verified", req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip"), req.headers?.get("user-agent"));
          return null;
        }

        await logLoginAttempt(email, true, null, req.headers?.get("x-forwarded-for") || req.headers?.get("x-real-ip"), req.headers?.get("user-agent"), user.id);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        console.log('[JWT] Setting role:', user.role);
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role as "ADMIN" | "TEACHER";
      console.log('[Session] Role:', token.role);
      return session;
    },
  },
};
