import { NextResponse } from "next/server";
import { UnifiedSyncService } from "@/services/unified-sync.service";

export async function GET() {
  try {
    const syncService = new UnifiedSyncService();
    const result = await syncService.syncTeachers();

    return NextResponse.json({
      success: result.errors.length === 0,
      timestamp: new Date().toISOString(),
      synced: result.synced,
      failed: result.failed,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
