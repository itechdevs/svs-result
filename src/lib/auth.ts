import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/db";
import type { UserRole } from "@/types";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(db),

  session: { strategy: "jwt" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (email === "teacher@school.com" && password === "password") {
          return {
            id: "teacher-1",
            name: "Prof. Henderson",
            email: "teacher@school.com",
            role: "teacher" as UserRole,
          };
        }

        if (email === "admin@school.com" && password === "password") {
          return {
            id: "admin-1",
            name: "A. Portal Executive",
            email: "admin@school.com",
            role: "admin" as UserRole,
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: UserRole }).role ?? "teacher";
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = ((token.role as UserRole | undefined) ?? "teacher");
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});

