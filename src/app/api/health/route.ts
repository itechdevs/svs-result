import { NextResponse } from "next/server";
import { db } from "@/db";

/**
 * GET /api/health
 * Returns app + DB health status.
 * Used by monitoring services and deployment smoke tests.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "connected", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Health Check] DB ping failed:", error);
    return NextResponse.json(
      { status: "error", db: "disconnected", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
