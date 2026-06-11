import { NextResponse } from "next/server";
import { UnifiedSyncService } from "@/services/unified-sync.service";

export async function POST() {
  try {
    const syncService = new UnifiedSyncService();
    const result = await syncService.syncSubjects();

    return NextResponse.json({
      success: result.errors.length === 0,
      synced: result.synced,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
