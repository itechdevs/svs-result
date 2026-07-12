import { NextRequest, NextResponse } from "next/server";
import {
  getSyncEventStats,
  processPendingSyncEvents,
  verifySyncSecret,
} from "@/lib/result-sync-service";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized sync request" }, { status: 401 });

/**
 * POST /api/sync/events/process?limit=100
 * Drain pending sync events (secret or ADMIN session).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-sync-secret");
    let authorized = false;

    if (secret) {
      try {
        authorized = verifySyncSecret(secret);
      } catch {
        authorized = false;
      }
    }

    // Allow admin UI without secret when cookie session is admin
    if (!authorized) {
      try {
        const { requireRole } = await import("@/lib/auth");
        await requireRole("ADMIN");
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      return unauthorized();
    }

    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 100;
    const result = await processPendingSyncEvents(
      Number.isFinite(limit) ? limit : 100,
    );
    const stats = await getSyncEventStats();

    return NextResponse.json({
      ok: true,
      ...result,
      stats,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process pending events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/sync/events/process
 * Queue status for admin UI.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.headers.get("x-sync-secret");
    let authorized = false;

    if (secret) {
      try {
        authorized = verifySyncSecret(secret);
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      try {
        const { requireRole } = await import("@/lib/auth");
        await requireRole("ADMIN");
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      return unauthorized();
    }

    const stats = await getSyncEventStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load sync stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
