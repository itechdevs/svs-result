'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Layers, Library, Search, AlertCircle, Users, Sparkles } from 'lucide-react';
import { Input } from '@/components/shared/ui/input';

interface SyncedAllocation {
  id: string;
  name: string;
  syncedAt: string;
  hasAccount: boolean;
  subjects: { id: string; name: string; gradeLevel: string }[];
}

function SkeletonCard() {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 bg-muted rounded w-2/3" />
          <div className="h-2.5 bg-muted/60 rounded w-1/3" />
        </div>
      </div>
      <div className="h-2.5 bg-muted/60 rounded w-full" />
      <div className="h-2.5 bg-muted/60 rounded w-4/5" />
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
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">Teacher Allocations</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Synced teacher-subject assignments from school management system.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: GraduationCap, label: 'Teachers', value: loading ? '—' : allocations.length, gradient: 'from-primary/10 to-primary/5', border: 'border-primary/20' },
          { icon: Layers, label: 'Subjects', value: loading ? '—' : totalSubjects, gradient: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' },
          { icon: Library, label: 'Classes', value: loading ? '—' : totalClasses, gradient: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20' },
        ].map(({ icon: Icon, label, value, gradient, border }) => (
          <div key={label} className="bg-card text-card-foreground border border-border rounded-xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border ${border} shadow-sm`}>
              <Icon className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
              <p className="text-2xl font-extrabold text-foreground mt-1.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search teacher, subject, or class..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-10 h-10 text-xs"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card rounded-xl border border-border">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="font-semibold text-destructive">Failed to load allocations</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card rounded-xl border border-border">
          <Users className="w-8 h-8 text-muted-foreground/60" />
          <p className="font-semibold text-muted-foreground">
            {allocations.length === 0 ? 'No allocations synced yet' : 'No teachers match your search'}
          </p>
          <p className="text-xs text-muted-foreground/85">
            {allocations.length === 0 ? 'Sync teacher data from the Sync Management tab first.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(teacher => {
            const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const syncDate = new Date(teacher.syncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <div key={teacher.id} className="bg-gradient-to-br from-card to-muted/10 text-card-foreground border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  {/* Teacher identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                      <span className="text-xs font-extrabold text-primary">{initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate leading-snug">{teacher.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Synced {syncDate}</p>
                    </div>
                    {teacher.hasAccount && (
                      <span className="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Account
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border/80" />

                  {/* Assignments */}
                  <div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Assigned Classes &amp; Subjects</p>
                    {teacher.subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No subjects assigned</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects.map((s, idx) => (
                          <span key={idx} className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border/50">
                            {s.gradeLevel} · <span className="text-primary ml-1">{s.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-mono">
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
