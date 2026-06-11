import { NextResponse } from "next/server";
import { UnifiedSyncService } from "@/services/unified-sync.service";

export async function GET() {
  try {
    const syncService = new UnifiedSyncService();
    const result = await syncService.syncAll();

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
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
