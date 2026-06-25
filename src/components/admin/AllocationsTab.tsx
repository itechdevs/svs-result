'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap, Layers, Library, Search, AlertCircle, Users, Sparkles,
  History, ChevronRight, ClipboardList, BookOpen,
} from 'lucide-react';
import { Input } from '@/components/shared/ui/input';
import Link from 'next/link';
import { useSyncedAllocations } from '@/hooks/use-teacher-assignments';
import { cn } from '@/lib/utils';

type ActiveTab = 'allocations' | 'history';

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

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-muted shrink-0" /><div className="h-3.5 bg-muted rounded w-32" /></div></td>
      <td className="px-5 py-4"><div className="h-3 bg-muted/60 rounded w-20" /></td>
      <td className="px-5 py-4"><div className="h-3 bg-muted/60 rounded w-12" /></td>
      <td className="px-5 py-4"><div className="h-3 bg-muted/60 rounded w-16" /></td>
      <td className="px-5 py-4"><div className="h-5 bg-muted/60 rounded w-14" /></td>
    </tr>
  );
}

export default function AllocationsTab() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('allocations');
  const [query, setQuery] = useState('');

  const { data: allocations = [], isLoading, error } = useSyncedAllocations();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allocations.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.subjects.some(s => s.name.toLowerCase().includes(q) || s.gradeLevel.toLowerCase().includes(q))
    );
  }, [allocations, query]);

  const totalSubjects = allocations.reduce((acc, t) => acc + t.subjects.length, 0);
  const totalClasses = new Set(allocations.flatMap(t => t.subjects.map(s => s.gradeLevel))).size;

  const tabs = [
    { id: 'allocations' as ActiveTab, label: 'Current Allocations', icon: Users },
    { id: 'history' as ActiveTab, label: 'Teacher History', icon: History },
  ];

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
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Synced teacher-subject assignments and evaluation history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: GraduationCap, label: 'Teachers', value: isLoading ? '—' : allocations.length, gradient: 'from-primary/10 to-primary/5', border: 'border-primary/20' },
          { icon: Layers, label: 'Subjects', value: isLoading ? '—' : totalSubjects, gradient: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' },
          { icon: Library, label: 'Classes', value: isLoading ? '—' : totalClasses, gradient: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20' },
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

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'allocations' ? (
          <motion.div
            key="allocations-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search */}
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
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card rounded-xl border border-border">
                <AlertCircle className="w-8 h-8 text-destructive" />
                <p className="font-semibold text-destructive">Failed to load allocations</p>
                <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
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
        ) : (
          <motion.div
            key="history-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search */}
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

            {/* History Table */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden text-card-foreground">
              <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Teacher Evaluation History
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Click on a teacher to view all their created evaluations.</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                  {isLoading ? '…' : `${filtered.length} teacher${filtered.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {isLoading ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border">
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teacher</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Synced On</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subjects</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classes</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Account</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </tbody>
                  </table>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="font-semibold text-destructive">Failed to load teacher history</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <History className="w-10 h-10 text-muted-foreground/40" />
                  <p className="font-semibold text-muted-foreground">
                    {allocations.length === 0 ? 'No teachers synced yet' : 'No teachers match your search'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 max-w-xs">
                    {allocations.length === 0
                      ? 'Sync teacher data from the Sync Management tab first.'
                      : 'Try adjusting your search query.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border">
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Teacher</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Synced On</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subjects</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classes</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Account</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map(teacher => {
                        const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                        const syncDate = new Date(teacher.syncedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const uniqueClasses = new Set(teacher.subjects.map(s => s.gradeLevel));

                        return (
                          <tr
                            key={teacher.id}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            {/* Teacher */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                  <span className="text-[11px] font-extrabold text-primary">{initials}</span>
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-foreground">{teacher.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{teacher.subjects.length} assignment{teacher.subjects.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                            </td>

                            {/* Synced Date */}
                            <td className="px-5 py-4">
                              <span className="text-xs text-muted-foreground font-mono">{syncDate}</span>
                            </td>

                            {/* Subjects count */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-foreground">
                                <BookOpen className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                                <span className="font-semibold">{teacher.subjects.length}</span>
                              </div>
                            </td>

                            {/* Classes count */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-foreground">
                                <ClipboardList className="w-3.5 h-3.5 text-purple-500/70 shrink-0" />
                                <span className="font-semibold">{uniqueClasses.size}</span>
                              </div>
                            </td>

                            {/* Account status */}
                            <td className="px-5 py-4 text-center">
                              {teacher.hasAccount ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                  No Account
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/admin/allocations/${teacher.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all duration-200 group-hover:shadow-sm"
                              >
                                View Evaluations
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
