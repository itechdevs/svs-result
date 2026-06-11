// This custom login route has been replaced by NextAuth v5
// Login is now handled by: POST /api/auth/callback/credentials
// Use signIn("credentials", { email, password }) from next-auth/react on client
// Or use the built-in NextAuth signin flow

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Use NextAuth signin endpoint: POST /api/auth/callback/credentials" },
    { status: 410 }
  );
}
