'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Library, Layers, Upload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Allocation } from '@/types/academic';

interface AllocationsTabProps {
  allocations: Allocation[];
  toggleTeacherStatus: (id: string) => void;
  // Admin-specific functionality additions
  onImportSuccess?: () => void;
}

export default function AllocationsTab({ 
  allocations, 
  toggleTeacherStatus,
  onImportSuccess
}: AllocationsTabProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success'>('idle');
  const [importLog, setImportLog] = useState<{ imported: number; duplicates: number; failed: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const triggerImport = () => {
    if (!excelFile) return;
    setImportStatus('uploading');
    
    // Simulate reading & validating Excel data
    setTimeout(() => {
      setImportStatus('success');
      setImportLog({
        imported: 4,
        duplicates: 1,
        failed: 0
      });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Teacher Allocations &amp; Import Management</h1>
          <p className="text-xs text-slate-500">Supervise and map faculty assignments across sections. Import staff records via Excel.</p>
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Allocated Faculty</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">124 Teachers</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Academic Classes</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">32 Sections</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 border-slate-200 dark:border-border">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[#002045] dark:text-[#9ff5c1] border shadow-sm">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Active Subjects</p>
            <h4 className="text-2xl font-extrabold text-[#002045] dark:text-blue-300 mt-1">18 Curriculums</h4>
          </div>
        </div>
      </div>

      {/* Admin Teacher Import module */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-[#002045] dark:text-white">Teacher Import Management</h3>
        <p className="text-xs text-slate-500">Upload an Excel staff sheet to validate credentials, configure default passwords, and map assigned classes.</p>
        
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
              <span>{excelFile ? excelFile.name : "Choose Excel Staff Spreadsheet (.xlsx)"}</span>
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
              <span className="text-rose-600 dark:text-rose-450">✗ Failed: {importLog.failed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Allocations Table lists */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-border">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Faculty Allocation Roll</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-border">
                <th className="px-6 py-4">Teacher Name</th>
                <th className="px-6 py-4">Assigned Class &amp; Section</th>
                <th className="px-6 py-4">Tracked Subjects</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700 dark:text-slate-300 divide-y divide-slate-100 dark:divide-border">
              {allocations.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.classes.map((cls, index) => (
                        <span key={index} className="bg-blue-50 dark:bg-blue-950/40 text-[#002045] dark:text-blue-300 font-mono text-[10px] py-0.5 px-2 rounded-md font-semibold border dark:border-border">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {item.subjects.map((sub, index) => (
                        <span key={index} className="bg-slate-100 dark:bg-slate-850 text-[#002045] dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium border dark:border-border">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      item.status === 'Active' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-350"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", item.status === 'Active' ? "bg-emerald-500" : "bg-rose-500")}></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleTeacherStatus(item.id)}
                      className={cn(
                        "text-[10px] font-bold py-1.5 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-border cursor-pointer",
                        item.status === 'Active' ? "text-[#ba1a1a] dark:text-red-400" : "text-[#0b6c44] dark:text-[#9ff5c1]"
                      )}
                    >
                      {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
