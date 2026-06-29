import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logLoginAttempt } from "@/services/audit-service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});
