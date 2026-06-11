'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle, XCircle, Clock, Users, GraduationCap, BookOpen } from 'lucide-react';

type SyncType = 'teachers' | 'students' | 'subjects' | 'all';

export default function SyncManagementClient() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [syncType, setSyncType] = useState<SyncType>('all');

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
        <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Data Synchronization</h1>
        <p className="text-sm text-slate-500 mt-1">Sync data from Dhalpa School management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleSync('teachers')}
          disabled={syncing}
          className="bg-white dark:bg-card border rounded-xl shadow-sm p-5 hover:shadow-md transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-[#002045] dark:text-white">Teachers</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Sync teacher data</p>
        </button>

        <button
          onClick={() => handleSync('students')}
          disabled={syncing}
          className="bg-white dark:bg-card border rounded-xl shadow-sm p-5 hover:shadow-md transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-[#002045] dark:text-white">Students</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Sync student data</p>
        </button>

        <button
          onClick={() => handleSync('subjects')}
          disabled={syncing}
          className="bg-white dark:bg-card border rounded-xl shadow-sm p-5 hover:shadow-md transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-[#002045] dark:text-white">Subjects</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Sync subject data</p>
        </button>

        <button
          onClick={() => handleSync('all')}
          disabled={syncing}
          className="bg-[#002045] dark:bg-slate-800 border rounded-xl shadow-sm p-5 hover:shadow-md transition-all disabled:opacity-50 text-white"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            </div>
            <h3 className="font-semibold">Sync All</h3>
          </div>
          <p className="text-xs text-blue-200">Sync everything</p>
        </button>
      </div>

      {syncing && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Syncing {syncType}...
            </span>
          </div>
        </div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-5 ${
            result.success
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900'
              : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                {result.success ? 'Sync Completed' : 'Sync Failed'}
              </h3>

              {result.details ? (
                <div className="space-y-2">
                  {result.details.teachers && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Teachers:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-300">✓ {result.details.teachers.synced}</span>
                      {result.details.teachers.failed > 0 && (
                        <span className="ml-2 text-red-700 dark:text-red-300">✗ {result.details.teachers.failed}</span>
                      )}
                    </div>
                  )}
                  {result.details.students && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Students:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-300">✓ {result.details.students.synced}</span>
                      {result.details.students.failed > 0 && (
                        <span className="ml-2 text-red-700 dark:text-red-300">✗ {result.details.students.failed}</span>
                      )}
                    </div>
                  )}
                  {result.details.subjects && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Subjects:</span>
                      <span className="ml-2 text-emerald-700 dark:text-emerald-300">✓ {result.details.subjects.synced}</span>
                      {result.details.subjects.failed > 0 && (
                        <span className="ml-2 text-red-700 dark:text-red-300">✗ {result.details.subjects.failed}</span>
                      )}
                    </div>
                  )}
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                    Total: {result.totalSynced} synced, {result.totalFailed} failed
                  </div>
                </div>
              ) : (
                <>
                  {result.synced !== undefined && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      ✓ {result.synced} records synced
                    </p>
                  )}
                  {result.failed > 0 && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      ✗ {result.failed} records failed
                    </p>
                  )}
                </>
              )}

              {result.error && (
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{result.error}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-white dark:bg-card border rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#002045] dark:text-white mb-2">Auto Sync Setup</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Configure automatic synchronization using cron jobs:
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sync All Entities:</p>
                <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs">
                  0 * * * * curl -X GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/sync/all/cron
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Sync Teachers Only:</p>
                <code className="block p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs">
                  0 * * * * curl -X GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/sync/teachers/cron
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
