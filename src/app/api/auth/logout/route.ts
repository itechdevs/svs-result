// Logout is handled by NextAuth v5
// Use: POST /api/auth/signout
// Or client-side: signOut() from next-auth/react

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Use NextAuth signout endpoint: POST /api/auth/signout" },
    { status: 410 }
  );
}
