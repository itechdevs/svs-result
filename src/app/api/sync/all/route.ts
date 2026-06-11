import { NextResponse } from "next/server";
import { UnifiedSyncService } from "@/services/unified-sync.service";

export async function POST() {
  try {
    const syncService = new UnifiedSyncService();
    const result = await syncService.syncAll();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
