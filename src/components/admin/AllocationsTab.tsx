'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Layers, Library, Search, AlertCircle, Users } from 'lucide-react';

interface SyncedAllocation {
  id: string;
  name: string;
  syncedAt: string;
  hasAccount: boolean;
  subjects: { id: string; name: string; gradeLevel: string }[];
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-full" />
      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-4/5" />
    </div>
  );
}

export default function AllocationsTab() {
  const [allocations, setAllocations] = useState<SyncedAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/allocations/synced');
        if (!res.ok) throw new Error('Failed to fetch allocations');
        const data = await res.json();
        setAllocations(data.allocations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allocations.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.subjects.some(s => s.name.toLowerCase().includes(q) || s.gradeLevel.toLowerCase().includes(q))
    );
  }, [allocations, query]);

  const totalSubjects = allocations.reduce((acc, t) => acc + t.subjects.length, 0);
  const totalClasses = new Set(allocations.flatMap(t => t.subjects.map(s => s.gradeLevel))).size;

  return (
    <motion.div
      key="allocations-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Teacher Allocations</h1>
        <p className="text-xs text-slate-500 mt-1">Synced teacher-subject assignments from school management system.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: GraduationCap, label: 'Teachers', value: loading ? '—' : allocations.length },
          { icon: Layers, label: 'Subjects', value: loading ? '—' : totalSubjects },
          { icon: Library, label: 'Classes', value: loading ? '—' : totalClasses },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border shadow-sm">
              <Icon className="w-5 h-5 text-[#002045] dark:text-[#9ff5c1]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search teacher, subject, or class..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-border rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1]"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="font-semibold text-red-600 dark:text-red-400">Failed to load allocations</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-500">
            {allocations.length === 0 ? 'No allocations synced yet' : 'No teachers match your search'}
          </p>
          <p className="text-xs text-slate-400">
            {allocations.length === 0 ? 'Sync teacher data from the Sync Management tab first.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(teacher => {
            const assignments = teacher.subjects.map(s => `${s.gradeLevel}(${s.name})`).join(', ');
            const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const syncDate = new Date(teacher.syncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div key={teacher.id} className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                {/* Teacher identity */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#002045]/10 dark:bg-blue-950 flex items-center justify-center shrink-0 border border-[#002045]/20 dark:border-blue-900">
                    <span className="text-xs font-bold text-[#002045] dark:text-blue-300">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#002045] dark:text-white truncate">{teacher.name}</p>
                    <p className="text-[10px] text-slate-400">Synced {syncDate}</p>
                  </div>
                  {teacher.hasAccount && (
                    <span className="ml-auto shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      Account
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-border" />

                {/* Assignments */}
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Assigned Classes &amp; Subjects</p>
                  {teacher.subjects.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No subjects assigned</p>
                  ) : (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{assignments}</p>
                  )}
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {teacher.subjects.length} subject{teacher.subjects.length !== 1 ? 's' : ''}
                    {' · '}
                    {new Set(teacher.subjects.map(s => s.gradeLevel)).size} class{new Set(teacher.subjects.map(s => s.gradeLevel)).size !== 1 ? 'es' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
