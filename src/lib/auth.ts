import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/db";
// import GitHub from "next-auth/providers/github";
// import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  session: { strategy: "jwt" },

  providers: [
    // Add OAuth providers here:
    // GitHub({ clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! }),
    // Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.role) {
        (session.user as typeof session.user & { role: string }).role =
          token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
