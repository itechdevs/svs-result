'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle, XCircle, Clock, Users, GraduationCap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncType = 'teachers' | 'students' | 'subjects' | 'all';

export default function SyncManagementClient() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [syncType, setSyncType] = useState<SyncType>('all');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleSync = async (type: SyncType) => {
    setSyncing(true);
    setResult(null);
    setSyncType(type);

    try {
      const endpoint = type === 'all' ? '/api/sync/all' : `/api/sync/${type}`;
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Synchronization</h1>
        <p className="text-sm text-muted-foreground mt-1">Sync data from Dhalpa School management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleSync('teachers')}
          disabled={syncing}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5 hover:shadow-md hover:border-primary/50 transition-all disabled:opacity-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Teachers</h3>
          </div>
          <p className="text-xs text-muted-foreground">Sync teacher data</p>
        </button>

        <button
          onClick={() => handleSync('students')}
          disabled={syncing}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5 hover:shadow-md hover:border-primary/50 transition-all disabled:opacity-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground">Students</h3>
          </div>
          <p className="text-xs text-muted-foreground">Sync student data</p>
        </button>

        <button
          onClick={() => handleSync('subjects')}
          disabled={syncing}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5 hover:shadow-md hover:border-primary/50 transition-all disabled:opacity-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-foreground">Subjects</h3>
          </div>
          <p className="text-xs text-muted-foreground">Sync subject data</p>
        </button>

        <button
          onClick={() => handleSync('all')}
          disabled={syncing}
          className="bg-primary border border-primary text-primary-foreground rounded-xl shadow-sm p-5 hover:shadow-md hover:bg-primary/95 transition-all disabled:opacity-50 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <RefreshCw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </div>
            <h3 className="font-semibold">Sync All</h3>
          </div>
          <p className="text-xs text-primary-foreground/85">Sync everything</p>
        </button>
      </div>

      {syncing && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm font-medium text-foreground">
              Syncing {syncType}...
            </span>
          </div>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-lg p-5 border",
            result.success
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-destructive/5 border-destructive/20"
          )}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-destructive mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold mb-2",
                result.success ? "text-emerald-800 dark:text-emerald-400" : "text-destructive"
              )}>
                {result.success ? 'Sync Completed' : 'Sync Failed'}
              </h3>

              {result.details ? (
                <div className="space-y-2">
                  {result.details.teachers && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Teachers:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-400 font-medium">✓ {result.details.teachers.synced}</span>
                      {result.details.teachers.failed > 0 && (
                        <span className="ml-2 text-destructive font-medium">✗ {result.details.teachers.failed}</span>
                      )}
                    </div>
                  )}
                  {result.details.students && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Students:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-400 font-medium">✓ {result.details.students.synced}</span>
                      {result.details.students.failed > 0 && (
                        <span className="ml-2 text-destructive font-medium">✗ {result.details.students.failed}</span>
                      )}
                    </div>
                  )}
                  {result.details.subjects && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Subjects:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-400 font-medium">✓ {result.details.subjects.synced}</span>
                      {result.details.subjects.failed > 0 && (
                        <span className="ml-2 text-destructive font-medium">✗ {result.details.subjects.failed}</span>
                      )}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-foreground pt-2 border-t border-border">
                    Total: {result.totalSynced} synced, {result.totalFailed} failed
                  </div>
                </div>
              ) : (
                <>
                  {result.synced !== undefined && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      ✓ {result.synced} records synced
                    </p>
                  )}
                  {result.failed > 0 && (
                    <p className="text-sm text-destructive">
                      ✗ {result.failed} records failed
                    </p>
                  )}
                </>
              )}

              {result.error && (
                <p className="mt-2 text-sm text-destructive">{result.error}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Auto Sync Setup</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Configure automatic synchronization using cron jobs:
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Sync All Entities:</p>
                <code className="block p-2 bg-muted rounded text-xs font-mono text-foreground border border-border">
                  0 * * * * curl -X GET {origin}/api/sync/all/cron
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Sync Teachers Only:</p>
                <code className="block p-2 bg-muted rounded text-xs font-mono text-foreground border border-border">
                  0 * * * * curl -X GET {origin}/api/sync/teachers/cron
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
