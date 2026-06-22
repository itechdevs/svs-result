import { UnifiedSyncService } from "@/services/unified-sync.service";

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let syncTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

function getIntervalMs(): number {
  const raw = process.env.AUTO_SYNC_INTERVAL_MINUTES;
  if (!raw) return DEFAULT_INTERVAL_MS;
  const minutes = parseInt(raw, 10);
  if (isNaN(minutes) || minutes <= 0) return DEFAULT_INTERVAL_MS;
  return minutes * 60 * 1000;
}

async function runSync(): Promise<void> {
  if (isRunning) {
    console.log("[AUTO-SYNC] Skipped — previous run still in progress");
    return;
  }

  isRunning = true;
  const start = Date.now();

  try {
    console.log("[AUTO-SYNC] Starting scheduled sync…");
    const service = new UnifiedSyncService();
    const result = await service.syncAll();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `[AUTO-SYNC] Completed in ${elapsed}s — synced: ${result.totalSynced}, failed: ${result.totalFailed}`,
    );
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(
      `[AUTO-SYNC] Failed after ${elapsed}s:`,
      err instanceof Error ? err.message : err,
    );
  } finally {
    isRunning = false;
  }
}

/**
 * Start the automatic sync scheduler.
 * Safe to call multiple times — duplicates are prevented.
 */
export function startAutoSync(): void {
  if (syncTimer !== null) return;

  const enabled = process.env.AUTO_SYNC_ENABLED;
  if (enabled && enabled !== "true" && enabled !== "1") {
    console.log("[AUTO-SYNC] Disabled (AUTO_SYNC_ENABLED is not 'true')");
    return;
  }

  const intervalMs = getIntervalMs();
  const intervalMin = (intervalMs / 60_000).toFixed(0);

  console.log(`[AUTO-SYNC] Enabled — interval every ${intervalMin} minute(s)`);

  // Run once immediately on startup, then on interval
  runSync();
  syncTimer = setInterval(runSync, intervalMs);
}

/** Stop the scheduler (useful for graceful shutdown). */
export function stopAutoSync(): void {
  if (syncTimer !== null) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log("[AUTO-SYNC] Stopped");
  }
}
