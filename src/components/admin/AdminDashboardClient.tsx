'use client';

import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const classPerformance = [
  { grade: 'Grade 10', gpa: 3.2, color: 'bg-[#002045]' },
  { grade: 'Grade 11', gpa: 3.6, color: 'bg-[#002045]' },
  { grade: 'Grade 12', gpa: 3.5, color: 'bg-[#002045]' },
  { grade: 'Bachelors', gpa: 3.8, color: 'bg-[#7fb8a0]' },
  { grade: 'Masters', gpa: 3.3, color: 'bg-[#002045]' },
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
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of academic performance and results</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Total Students */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-[#3f5f90] dark:text-slate-400 mb-2">Total Students</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-[#002045] dark:text-white">2,482</div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>+4%</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-[#002045] dark:bg-blue-500 rounded-full w-16"></div>
        </div>

        {/* Pass % */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-[#3f5f90] dark:text-slate-400 mb-2">Pass %</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">88.4%</div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>2.1%</span>
            </div>
          </div>
          <div className="mt-3 flex gap-1">
            <div className="h-1 bg-emerald-600 rounded-full flex-1"></div>
            <div className="h-1 bg-emerald-600 rounded-full flex-1"></div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full flex-1"></div>
          </div>
        </div>

        {/* Fail % */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-[#3f5f90] dark:text-slate-400 mb-2">Fail %</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">11.6%</div>
            <div className="flex items-center gap-1 text-red-600 text-xs font-semibold mb-1">
              <TrendingDown className="w-3 h-3" />
              <span>0.5%</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-red-600 rounded-full w-12"></div>
        </div>

        {/* Re-Exam Required */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-[#3f5f90] dark:text-slate-400 mb-2">Re-Exam Req.</div>
          <div className="text-3xl font-bold text-[#002045] dark:text-white">142</div>
          <div className="mt-2 text-[10px] text-slate-500 font-medium">
            <span className="text-red-600 font-bold">42 Scheduled</span> / 100 Urgency
          </div>
        </div>

        {/* Published Results */}
        <div className="bg-[#002045] dark:bg-slate-800 border border-[#002045] dark:border-slate-700 p-5 rounded-2xl shadow-sm text-white">
          <div className="text-xs font-semibold text-blue-200 mb-2">Published Results</div>
          <div className="text-3xl font-bold">18 / 24</div>
          <div className="mt-2 text-xs text-blue-200">75% Completion Rate</div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Class-wise Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-bold text-[#002045] dark:text-white text-base">Class-wise Performance</h2>
              <p className="text-xs text-[#5d73a8] dark:text-slate-400 mt-1">Average GPA Comparison across Departments</p>
            </div>
            <span className="text-xs font-semibold text-[#3f5f90] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg">
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
                        'w-full rounded-t-lg relative group cursor-pointer transition-all hover:opacity-80'
                      )}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-[#002045] text-white text-xs font-bold px-2 py-1 rounded">
                          GPA: {item.gpa}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-[#3f5f90] dark:text-slate-300">{item.grade}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pass vs Fail Distribution */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <h2 className="font-bold text-[#002045] dark:text-white text-base">Pass vs Fail</h2>
            <p className="text-xs text-[#5d73a8] dark:text-slate-400 mt-1">Aggregate distribution</p>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#dc2626" strokeWidth="20"
                  strokeDasharray={`${failRate * 2.51} ${(100 - failRate) * 2.51}`}
                  className="transition-all duration-1000"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none" stroke="#059669" strokeWidth="20"
                  strokeDasharray={`${passRate * 2.51} ${(100 - passRate) * 2.51}`}
                  strokeDashoffset={`-${failRate * 2.51}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-[#002045] dark:text-white">{passRate}%</div>
                <div className="text-xs font-semibold text-[#5d73a8] dark:text-slate-400 uppercase tracking-wider">Pass Rate</div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Passed</span>
              </div>
              <span className="text-sm font-bold text-[#002045] dark:text-white">{totalPassed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Failed</span>
              </div>
              <span className="text-sm font-bold text-[#002045] dark:text-white">{totalFailed}</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
