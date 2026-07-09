import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  enqueueSyncEvent,
  processSyncEventByEventId,
  validateSyncEnvelope,
  verifySyncSecret,
} from "@/lib/result-sync-service";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized sync request" }, { status: 401 });

const parseProcessNow = (value: string | null) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return !(normalized === "false" || normalized === "0" || normalized === "no");
};

/**
 * POST /api/sync/events?processNow=true|false
 * Ingest a push sync event from dhalpa-school (idempotent by eventId).
 * Auth: x-sync-secret header.
 */
export async function POST(request: NextRequest) {
  // FIRST LOG - to verify handler is called
  process.stderr.write(`[SYNC_EVENTS_POST_CALLED] ${new Date().toISOString()}\n`);
  console.log("[SYNC_EVENTS_POST_CALLED]", new Date().toISOString());
  
  try {
    const secret = request.headers.get("x-sync-secret");
    
    // Debug logging
    process.stderr.write(`[SYNC_EVENTS_RECEIVE] Secret length: ${secret?.length}\n`);
    console.log("[SYNC_EVENTS_RECEIVE]", {
      hasSecret: !!secret,
      secretLength: secret?.length,
      secretFirst10: secret?.substring(0, 10),
      secretLast10: secret?.substring(secret?.length - 10),
      url: request.url,
    });
    
    if (!verifySyncSecret(secret)) {
      console.log("[SYNC_EVENTS_AUTH_FAIL] Secret verification failed");
      return unauthorized();
    }

    const body = await request.json();
    const envelope = validateSyncEnvelope(body);
    
    console.log("[SYNC_EVENTS_VALIDATED]", {
      eventId: envelope.eventId,
      entityType: envelope.entityType,
      action: envelope.action,
      entityId: envelope.entityId,
    });
    
    const processNow = parseProcessNow(
      request.nextUrl.searchParams.get("processNow"),
    );

    try {
      await enqueueSyncEvent(envelope);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          eventId: envelope.eventId,
        });
      }
      throw error;
    }

    if (!processNow) {
      return NextResponse.json({
        ok: true,
        queued: true,
        eventId: envelope.eventId,
      });
    }

    const processed = await processSyncEventByEventId(envelope.eventId);

    return NextResponse.json({
      ok: processed.status === "PROCESSED" || processed.status === "IGNORED",
      queued: true,
      eventId: envelope.eventId,
      status: processed.status,
      attempts: processed.attempts,
      lastError: processed.lastError,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process sync event";
    const status = message.includes("SYNC_SERVICE_SECRET") ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
