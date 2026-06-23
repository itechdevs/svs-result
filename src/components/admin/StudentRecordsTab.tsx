'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Printer, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Student } from '@/types/academic';
import { buttonVariants } from '@/components/shared/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/shared/ui/table';

interface StudentRecordsTabProps {
  students: Student[];
  gradingStudentId: string;
  setGradingStudentId: (id: string) => void;
  setCurrentTab: (tab: 'dashboard' | 'evaluations' | 'mark-entry' | 'student-records' | 'allocations' | 'result-compilation' | 're-exam-portal' | 'create-evaluation') => void;
  setShowTranscriptModal: (student: Student | null) => void;
  role: string;
}

export default function StudentRecordsTab({
  students,
  gradingStudentId,
  setGradingStudentId,
  setCurrentTab,
  setShowTranscriptModal,
  role,
}: StudentRecordsTabProps) {
  
  const activeGradingStudent = students.find(s => s.id === gradingStudentId) || students[0];
  const isAdmin = role === 'admin';

  return (
    <motion.div 
      key="student-records-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Student Academic Archives</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Query and print detailed semester marks sheets and GPA transcript records.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setCurrentTab('result-compilation')}
            className={cn(buttonVariants({ variant: 'default' }), "h-10 text-xs px-5 shadow-sm shrink-0")}
          >
            Results Center
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left directory column */}
        <div className="lg:col-span-4 bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-muted/40 border-b border-border flex justify-between items-center text-xs font-bold text-foreground">
            <span>Student Directory</span>
          </div>
          <div className="divide-y divide-border max-h-[550px] overflow-y-auto">
            {students.map((student) => (
              <button 
                key={student.id}
                onClick={() => setGradingStudentId(student.id)}
                className={cn(
                  "w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-center gap-3 outline-none cursor-pointer border-r-4 border-transparent",
                  gradingStudentId === student.id && "bg-primary/5 border-r-primary"
                )}
              >
                <div className="w-9 h-9 bg-muted rounded-full overflow-hidden border border-border">
                  <img src={student.avatar} alt="student avatar" className="object-cover w-full h-full" />
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">{student.name}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">{student.class}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* High Fidelity Performance Sheet Details Card */}
        <div className="lg:col-span-8 bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border border-border relative shrink-0">
                <img src={activeGradingStudent.avatar} alt="student avatar" className="object-cover w-full h-full" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">{activeGradingStudent.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">ID: {activeGradingStudent.id}</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                    activeGradingStudent.status === 'Active Enrollment'
                      ? "bg-emerald-105 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-350 border-emerald-250 dark:border-emerald-900/40"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  )}>
                    {activeGradingStudent.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin ? (
                <button 
                  onClick={() => setShowTranscriptModal(activeGradingStudent)}
                  className="px-4 py-2 border border-input hover:bg-muted text-foreground font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Official Sheet Preview</span>
                </button>
              ) : (
                <div className="px-3 py-2 bg-muted border border-border rounded-lg text-muted-foreground text-[10px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Report Cards restricted to Admin Role</span>
                </div>
              )}
            </div>
          </div>

          {/* Simple student details widgets */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted/20 p-4 border border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-muted-foreground block tracking-wider">Current Cycle Class</span>
              <p className="text-xs font-extrabold text-primary mt-1">{activeGradingStudent.class}</p>
            </div>
            <div className="bg-muted/20 p-4 border border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-muted-foreground block tracking-wider">Attendance Rate</span>
              <p className="text-xs font-extrabold text-primary mt-1">{activeGradingStudent.attendance}</p>
            </div>
            <div className="bg-muted/20 p-4 border border-border rounded-xl">
              <span className="text-[8px] font-bold uppercase text-muted-foreground block tracking-wider">Assigned Department</span>
              <p className="text-xs font-extrabold text-primary mt-1">{activeGradingStudent.department}</p>
            </div>
          </div>

          {/* Performances matrix items list */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Subject Performance Matrix</h3>
            
            <div className="overflow-x-auto w-full border border-border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-muted-foreground font-bold text-[10px] uppercase border-b border-border">
                    <TableHead className="p-3 text-muted-foreground font-bold text-[10px]">Subject Name</TableHead>
                    <TableHead className="p-3 text-muted-foreground font-bold text-[10px]">Assessment Context</TableHead>
                    <TableHead className="p-3 text-center text-muted-foreground font-bold text-[10px]">Score Ratio</TableHead>
                    <TableHead className="p-3 text-right text-muted-foreground font-bold text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-foreground">
                  {activeGradingStudent.scores.map((scoreItem, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="p-3 font-semibold text-foreground">{scoreItem.subject}</TableCell>
                      <TableCell className="p-3 text-muted-foreground">{scoreItem.type}</TableCell>
                      <TableCell className="p-3 text-center font-mono font-bold">{scoreItem.obtained} / {scoreItem.max}</TableCell>
                      <TableCell className="p-3 text-right">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                          scoreItem.pass
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-350 border-emerald-250 dark:border-emerald-900/40"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                          {scoreItem.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Bottom GPA analytics radial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="bg-primary text-primary-foreground p-5 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-primary-foreground/80 uppercase tracking-widest block">Aggregate standing</span>
                <h4 className="text-xl font-bold mt-1">Academic Success GPA</h4>
              </div>
              <div className="mt-8">
                <p className="text-3xl font-extrabold tracking-tight">{activeGradingStudent.overallPercent}%</p>
                <p className="text-[11px] text-primary-foreground/80 mt-2">CGPA Equivalent Rating of {activeGradingStudent.overallTotal}</p>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Result Decision</span>
                <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 uppercase">{activeGradingStudent.resultStatus}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-6 leading-relaxed italic">&ldquo;{activeGradingStudent.remarks}&rdquo;</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
