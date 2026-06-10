'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { GraduationCap, Library, Layers, Upload, CheckCircle2, Search, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Allocation } from '@/types/academic';

interface AllocationsTabProps {
  allocations: Allocation[];
  onImportSuccess?: () => void;
}

export default function AllocationsTab({
  allocations: initialAllocations,
  onImportSuccess
}: AllocationsTabProps) {
  const [allocations, setAllocations] = useState<Allocation[]>(initialAllocations);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [importLog, setImportLog] = useState<{ imported: number; duplicates: number; failed: number } | null>(null);

  const [teacherQuery, setTeacherQuery] = useState('');
  const [classQuery, setClassQuery] = useState('');
  const [subjectQuery, setSubjectQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // ✅ Toggle status internally
  const toggleTeacherStatus = (id: string) => {
    setAllocations(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' }
          : item
      )
    );
  };

  const filteredAllocations = useMemo(() => {
    return allocations.filter(item => {
      const matchesTeacher = item.teacher.toLowerCase().includes(teacherQuery.toLowerCase());
      const matchesClass = classQuery === '' || item.classes.some(c => c.toLowerCase().includes(classQuery.toLowerCase()));
      const matchesSubject = subjectQuery === '' || item.subjects.some(s => s.toLowerCase().includes(subjectQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesTeacher && matchesClass && matchesSubject && matchesStatus;
    });
  }, [allocations, teacherQuery, classQuery, subjectQuery, statusFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const triggerImport = () => {
    if (!excelFile) return;
    setImportStatus('uploading');
    setTimeout(() => {
      setImportStatus('success');
      setImportLog({ imported: 4, duplicates: 1, failed: 0 });
      if (onImportSuccess) onImportSuccess();
    }, 2000);
  };

  return (
    <motion.div
      key="allocations-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Teacher Allocations</h1>
          <p className="text-xs text-slate-500">Import staff records via Excel.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Teachers</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">124 Teachers</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Classes</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">32 Classes</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Subjects</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">18</h4>
          </div>
        </div>
      </div>

      {/* Import Module */}
      {/* <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#002045] dark:text-white">Teacher Import Management</h3>
        <p className="text-xs text-slate-500">
          Upload an Excel staff sheet to validate credentials, configure default passwords, and map assigned classes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <div className="relative border border-dashed border-slate-300 dark:border-border rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 flex-grow text-center w-full">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Upload className="w-4 h-4 text-[#002045] dark:text-[#9ff5c1]" />
              <span>{excelFile ? excelFile.name : 'Choose Excel Staff Spreadsheet (.xlsx)'}</span>
            </div>
          </div>

          <button
            onClick={triggerImport}
            disabled={!excelFile || importStatus === 'uploading'}
            className="w-full sm:w-auto px-6 py-3 bg-[#002045] hover:bg-opacity-95 text-white font-bold text-xs rounded-xl shadow-sm disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 cursor-pointer"
          >
            {importStatus === 'uploading' ? 'Importing & Validating...' : 'Start staff import'}
          </button>
        </div>

        {importStatus === 'success' && importLog && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-1 text-xs">
            <div className="flex items-center gap-1 text-[#0a6c44] dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Process Completed!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-slate-600 dark:text-slate-300 font-semibold font-mono">
              <span className="text-[#0a6c44] dark:text-emerald-400">✓ Imported: {importLog.imported}</span>
              <span className="text-amber-600 dark:text-amber-400">⚡ Duplicates: {importLog.duplicates}</span>
              <span className="text-rose-600">✗ Failed: {importLog.failed}</span>
            </div>
          </div>
        )}
      </div> */}

      {/* Allocations Table */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-border space-y-3">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Allocation</h3>

          {/* Search Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Teacher */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher..."
                value={teacherQuery}
                onChange={(e) => setTeacherQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-border rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1]"
              />
            </div>

            {/* Class */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search class..."
                value={classQuery}
                onChange={(e) => setClassQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-border rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1]"
              />
            </div>

            {/* Subject */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject..."
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-border rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1]"
              />
            </div>

            {/* Status */}
            {/* <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive')}
              className="px-4 py-2 text-xs border border-slate-200 dark:border-border rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002045] dark:focus:ring-[#9ff5c1] cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-border">
                <th className="px-6 py-4">Teacher Name</th>
                <th className="px-6 py-4">Assigned Class &amp; Section</th>
                <th className="px-6 py-4">Subjects</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-border">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No teachers found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Teacher */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border dark:border-border">
                          <img src={item.avatar} alt="teacher" className="object-cover w-full h-full" />
                        </div>
                        <div>
                          <p className="font-bold text-[#002045] dark:text-blue-300">{item.teacher}</p>
                          <p className="text-[10px] text-slate-400">{item.title}</p>
                        </div>
                      </div>
                    </td>

                    {/* Classes */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.classes.map((cls, index) => (
                          <span
                            key={index}
                            className="bg-blue-50 dark:bg-blue-950/40 text-[#002045] dark:text-blue-300 font-mono text-[10px] py-0.5 px-2 rounded-md font-semibold border dark:border-border"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Subjects */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.subjects.map((sub, index) => (
                          <span
                            key={index}
                            className="bg-slate-100 dark:bg-slate-800 text-[#002045] dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium border dark:border-border"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Details */}
                        <Link
                          href={`/admin/allocations/${item.id}`}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold py-1.5 px-3 rounded border border-slate-200 dark:border-border text-[#002045] dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Details
                        </Link>

                        {/* ✅ Activate / Deactivate — status updates immediately */}
                        {/* <button
                          onClick={() => toggleTeacherStatus(item.id)}
                          className={cn(
                            "text-[10px] font-bold py-1.5 px-3 rounded border border-slate-200 dark:border-border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                            item.status === 'Active'
                              ? "text-[#ba1a1a] dark:text-red-400"
                              : "text-[#0b6c44] dark:text-[#9ff5c1]"
                          )}
                        >
                          {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}