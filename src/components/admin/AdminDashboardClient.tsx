'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const classPerformance = [
  { grade: 'Grade 10', gpa: 3.2, color: 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300' },
  { grade: 'Grade 11', gpa: 3.6, color: 'bg-gradient-to-t from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300' },
  { grade: 'Grade 12', gpa: 3.5, color: 'bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300' },
  { grade: 'Bachelors', gpa: 3.8, color: 'bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-500 dark:to-emerald-300' },
  { grade: 'Masters', gpa: 3.3, color: 'bg-gradient-to-t from-amber-600 to-amber-400 dark:from-amber-500 dark:to-amber-300' },
];

const passRate = 88;
const failRate = 12;
const totalPassed = 2194;
const totalFailed = 288;

export default function AdminDashboardClient() {
  return (
    <motion.div
      key="admin-dashboard-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of academic performance and results</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Total Students */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">Total Students</div>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight">2,482</div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>+4%</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-primary rounded-full w-16 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* Pass % */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">Pass %</div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight text-emerald-650 dark:text-emerald-400">88.4%</div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>2.1%</span>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            <div className="h-1 bg-emerald-600 rounded-full flex-1"></div>
            <div className="h-1 bg-emerald-600 rounded-full flex-1"></div>
            <div className="h-1 bg-muted rounded-full flex-1 group-hover:bg-emerald-600/30 transition-all duration-500"></div>
          </div>
        </div>

        {/* Fail % */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">Fail %</div>
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all duration-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold tracking-tight text-destructive">11.6%</div>
            <div className="flex items-center gap-1 text-destructive text-xs font-semibold mb-1">
              <TrendingDown className="w-3 h-3" />
              <span>0.5%</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-destructive rounded-full w-12 group-hover:w-full transition-all duration-500"></div>
        </div>

        {/* Re-Exam Required */}
        <div className="group bg-gradient-to-br from-card to-muted/20 text-card-foreground border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-muted-foreground">Re-Exam Req.</div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-605 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight">142</div>
          <div className="mt-2 text-[10px] text-muted-foreground font-medium">
            <span className="text-destructive font-bold">42 Scheduled</span> / 100 Urgency
          </div>
        </div>

        {/* Published Results */}
        <div className="group bg-gradient-to-br from-primary to-primary/80 border border-primary p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div className="flex justify-between items-start mb-3">
            <div className="text-xs font-semibold text-white/85">Published Results</div>
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary transition-all duration-300">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight text-white">18 / 24</div>
          <div className="mt-2 text-xs text-white/80">75% Completion Rate</div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Class-wise Performance */}
        <div className="lg:col-span-2 bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-bold text-lg text-foreground">Class-wise Performance</h2>
              <p className="text-xs text-muted-foreground mt-1">Average GPA Comparison across Departments</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
              Annual Term 2023-24
            </span>
          </div>

          <div className="flex items-end justify-between gap-4 h-64">
            {classPerformance.map((item, index) => {
              const maxGPA = 4.0;
              const heightPercent = (item.gpa / maxGPA) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={cn(
                        item.color,
                        'w-full rounded-t-lg relative group cursor-pointer transition-all hover:opacity-90 shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.1)] hover:shadow-lg'
                      )}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-card text-card-foreground border border-border text-[11px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
                          GPA: {item.gpa}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-muted-foreground">{item.grade}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pass vs Fail Distribution */}
        <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h2 className="font-bold text-lg text-foreground">Pass vs Fail</h2>
              <p className="text-xs text-muted-foreground mt-1">Aggregate distribution</p>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="currentColor" strokeWidth="12"
                    className="text-muted/30"
                  />
                  {/* Fail segment */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="currentColor" strokeWidth="12"
                    strokeDasharray={`${failRate * 2.51} ${(100 - failRate) * 2.51}`}
                    className="text-destructive transition-all duration-1000"
                  />
                  {/* Pass segment (Indigo) */}
                  <circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke="currentColor" strokeWidth="12"
                    strokeDasharray={`${passRate * 2.51} ${(100 - passRate) * 2.51}`}
                    strokeDashoffset={`-${failRate * 2.51}`}
                    className="text-indigo-600 dark:text-indigo-400 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-extrabold text-foreground tracking-tight">{passRate}%</div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Pass Rate</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-sm shadow-indigo-500/20"></div>
                <span className="text-sm font-medium text-foreground">Passed</span>
              </div>
              <span className="text-sm font-bold text-foreground">{totalPassed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive shadow-sm"></div>
                <span className="text-sm font-medium text-foreground">Failed</span>
              </div>
              <span className="text-sm font-bold text-foreground">{totalFailed}</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
