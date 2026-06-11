import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEACHER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "TEACHER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "TEACHER";
  }
}
