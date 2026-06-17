'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertCircle, Clock, CalendarCheck, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { useProfile } from '@/hooks/use-profile';
import { useSubjects } from '@/hooks/use-subjects';
import { SyncedStudent } from '@/hooks/use-students';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { buttonVariants } from '@/components/shared/ui/button';

export default function ReExamPortalTab() {
  const { data: profile } = useProfile();
  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 2000 });
  const { data: subjectsData = [] } = useSubjects();

  const [selectedClass, setSelectedClass] = useState('_all');
  const [selectedSubject, setSelectedSubject] = useState('_all');

  // Assigned classes from teacher profile (or all classes if ADMIN)
  const assignedClasses = useMemo(() => {
    if (profile?.role === 'ADMIN') {
      return Array.from(new Set(subjectsData.map(s => s.gradeLevel)));
    }
    if (!profile?.syncedTeacher?.subjects) return [];
    return Array.from(new Set(profile.syncedTeacher.subjects.map(s => s.gradeLevel)));
  }, [profile, subjectsData]);

  // Subjects for the selected class
  const subjectsForSelectedClass = useMemo(() => {
    if (selectedClass === '_all') return [];
    if (profile?.role === 'ADMIN') {
      return subjectsData.filter(s => s.gradeLevel === selectedClass).map(s => s.name);
    }
    if (!profile?.syncedTeacher?.subjects) return [];
    return profile.syncedTeacher.subjects
      .filter(s => s.gradeLevel === selectedClass)
      .map(s => s.name);
  }, [selectedClass, profile, subjectsData]);

  const studentsMap = useMemo(() => {
    const map: Record<string, SyncedStudent> = {};
    studentsData?.students.forEach(s => { map[s.id] = s; });
    return map;
  }, [studentsData]);

  // Compute failed items: results where marksObtained < passMarks on the template
  const failedItems = useMemo(() => {
    return resultsData
      .filter(r => {
        if (r.marksObtained === null || r.marksObtained === undefined) return false;
        const passMarks = r.evaluationTemplate?.passMarks ?? 0;
        return r.marksObtained < passMarks;
      })
      .map(r => ({
        studentId: r.syncedStudentId,
        studentName: r.syncedStudent?.name ?? studentsMap[r.syncedStudentId]?.name ?? 'Unknown',
        rollNumber: r.syncedStudent?.rollNumber ?? studentsMap[r.syncedStudentId]?.rollNumber ?? '—',
        grade: r.syncedStudent?.grade ?? studentsMap[r.syncedStudentId]?.grade ?? '—',
        subject: r.evaluationTemplate ? r.evaluationTemplate.name : '—',
        evaluationId: r.evaluationTemplateId,
        resultId: r.id,
        marksObtained: r.marksObtained,
        passMarks: r.evaluationTemplate?.passMarks ?? 0,
        hasReExam: false,
      }));
  }, [resultsData, studentsMap]);

  // Apply class + subject filters
  const filteredItems = useMemo(() => {
    let items = failedItems;
    if (selectedClass !== '_all') items = items.filter(f => f.grade === selectedClass);
    if (selectedSubject !== '_all') items = items.filter(f => f.subject === selectedSubject);
    return items;
  }, [failedItems, selectedClass, selectedSubject]);

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedSubject('_all');
  };

  return (
    <motion.div
      key="re-exam-portal-view"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Re-Examination Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Coordinate and score supplemental sessions for failed learning outcome targets.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Class</label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Classes</SelectItem>
                {assignedClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filter by Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Subjects</SelectItem>
                {subjectsForSelectedClass.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-destructive/5 border border-destructive/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Failed</p>
            <h4 className="text-2xl font-extrabold text-destructive mt-1">{filteredItems.length} Students</h4>
          </div>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Pending Grading</p>
            <h4 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {filteredItems.length} Pending
            </h4>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/15 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Scheduled</p>
            <h4 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              0 Scheduled
            </h4>
          </div>
        </div>
      </div>

      {/* Failed Students Registry */}
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/40">
          <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Failed Students Registry</h3>
          <p className="text-[10px] text-muted-foreground mt-1">Click View to enter re-exam marks for each student</p>
        </div>
        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No failed students found.</div>
          ) : (
            filteredItems.map(item => (
              <div
                key={`${item.studentId}-${item.evaluationId}`}
                className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-foreground">{item.studentName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">{item.rollNumber} · {item.grade}</div>
                  <div className="text-[11px] text-primary font-semibold mt-1">
                    {item.subject} · {item.marksObtained}/{item.passMarks} (Failed)
                  </div>
                </div>
                <Link
                  href={`/teacher/mark-entry/${item.studentId}?evalId=${item.evaluationId}`}
                  className={cn(buttonVariants({ size: 'sm', variant: 'default' }), "h-8 text-xs")}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
