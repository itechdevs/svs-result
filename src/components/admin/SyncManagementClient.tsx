'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Database, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStats {
  pending: number;
  processed: number;
  failed: number;
  lastProcessedAt?: string;
  lastProcessedEntity?: string;
  lastProcessedAction?: string;
}

export default function SyncManagementClient() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    loadStats();
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/sync/events/process');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load sync stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    setProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/sync/events/process', { method: 'POST' });
      const data = await response.json();
      setResult(data);
      await loadStats(); // Refresh stats after processing
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Sync Event Queue</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Push-based sync events from Dhalpa School
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-semibold text-foreground">Pending</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {loading ? '...' : stats?.pending ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Events waiting to be processed</p>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground">Processed</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {loading ? '...' : stats?.processed ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Successfully applied events</p>
        </div>

        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center border border-destructive/20">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="font-semibold text-foreground">Failed</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {loading ? '...' : stats?.failed ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Events that exceeded retry limit</p>
        </div>
      </div>

      {/* Last Processed Info */}
      {stats?.lastProcessedAt && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Activity className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Last Processed Event</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.lastProcessedEntity} / {stats.lastProcessedAction} at{' '}
                {new Date(stats.lastProcessedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Process Pending Button */}
      <button
        onClick={handleProcessPending}
        disabled={processing || (stats?.pending ?? 0) === 0}
        className="w-full bg-primary border border-primary text-primary-foreground rounded-xl shadow-sm p-5 hover:shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <RefreshCw className={cn("w-5 h-5", processing && "animate-spin")} />
          </div>
          <div>
            <h3 className="font-semibold">Process Pending Events</h3>
            <p className="text-xs text-primary-foreground/85 mt-0.5">
              {processing
                ? 'Processing events...'
                : (stats?.pending ?? 0) === 0
                ? 'No pending events'
                : `Process ${stats?.pending} pending event${stats?.pending === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </button>

      {/* Processing Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-lg p-5 border",
            result.ok
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-destructive/5 border-destructive/20"
          )}
        >
          <div className="flex items-start gap-3">
            {result.ok ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold mb-2",
                result.ok ? "text-emerald-800 dark:text-emerald-400" : "text-destructive"
              )}>
                {result.ok ? 'Processing Complete' : 'Processing Failed'}
              </h3>

              {result.ok && (
                <div className="space-y-1 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-400">
                    ✓ {result.processed ?? 0} event{result.processed === 1 ? '' : 's'} processed successfully
                  </p>
                  {(result.failed ?? 0) > 0 && (
                    <p className="text-destructive">
                      ✗ {result.failed} event{result.failed === 1 ? '' : 's'} failed
                    </p>
                  )}
                </div>
              )}

              {result.error && (
                <p className="mt-2 text-sm text-destructive">{result.error}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* How It Works */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">How Sync Works</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">1. Push-Based:</span> Dhalpa School
                  automatically pushes events when data changes (create/update/delete).
                </p>
                <p>
                  <span className="font-medium text-foreground">2. Event Queue:</span> Events are
                  stored in a durable queue (PENDING status).
                </p>
                <p>
                  <span className="font-medium text-foreground">3. Processing:</span> Events are
                  processed in order, with automatic retry on failure.
                </p>
                <p>
                  <span className="font-medium text-foreground">4. Idempotent:</span> Same event
                  can be replayed safely without duplicating data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bootstrap Info */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Initial Sync (Bootstrap)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                For full initial sync or recovery, use the bootstrap endpoint from Dhalpa School admin:
              </p>
              <code className="block p-2 bg-muted rounded text-xs font-mono text-foreground border border-border break-all">
                POST https://dashboard.svskirtipur.edu.np/api/admin/sync/result/bootstrap
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                This will sync all teachers, subjects, and students in the correct order.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Processing Info */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Automatic Processing</h3>
            <p className="text-xs text-muted-foreground">
              Events with <code className="px-1 py-0.5 bg-muted rounded text-foreground">processNow=true</code>{' '}
              are processed immediately when received. Manual processing is only needed for events that were queued
              during downtime or for retry of failed events.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
