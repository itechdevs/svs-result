'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AlertCircle, Clock, CalendarCheck, Eye } from 'lucide-react';
import { useStudentEvaluationResults } from '@/hooks/use-evaluations';
import { useStudents } from '@/hooks/use-students';
import { useProfile } from '@/hooks/use-profile';
import { useSubjects } from '@/hooks/use-subjects';
import { SyncedStudent } from '@/hooks/use-students';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';

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
      .map(r => {
        // Parse subject name and template display name from the raw template name
        const rawName = r.evaluationTemplate?.name ?? '';
        const newFmt = rawName.match(/^\[([^\]]+)\]\[([^\]]+)\]\s*(.+)$/);
        const legacyFmt = rawName.match(/^\[([^\]]+)\]\s*(.+)$/);
        const taskType = newFmt ? newFmt[2] : legacyFmt ? legacyFmt[1] : rawName;
        const subTask = newFmt ? newFmt[3] : legacyFmt ? legacyFmt[2] : rawName;
        // Get subject name from the nested relation (added to API response)
        const subjectName = (r.evaluationTemplate as unknown as { syncedSubject?: { name: string } })?.syncedSubject?.name ?? '—';

        return {
          studentId: r.syncedStudentId,
          studentName: r.syncedStudent?.name ?? studentsMap[r.syncedStudentId]?.name ?? 'Unknown',
          rollNumber: r.syncedStudent?.rollNumber ?? studentsMap[r.syncedStudentId]?.rollNumber ?? '—',
          grade: r.syncedStudent?.grade ?? studentsMap[r.syncedStudentId]?.grade ?? '—',
          subject: subjectName,
          templateName: `${taskType}: ${subTask}`,
          evaluationId: r.evaluationTemplateId,
          resultId: r.id,
          marksObtained: r.marksObtained,
          passMarks: r.evaluationTemplate?.passMarks ?? 0,
          hasReExam: false,
        };
      });
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
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-border">
          <div>
            <p className="font-bold text-sm text-[#002045] dark:text-white uppercase tracking-wider">Failed Students Registry</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Click View to enter re-exam marks for each student</p>
          </div>
          <span className="text-xs font-bold text-destructive">{filteredItems.length} student{filteredItems.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No failed students found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-border">
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Roll No</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Class</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center whitespace-nowrap">Marks</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border">
                {filteredItems.map(item => {
                  const viewHref = profile?.role === 'ADMIN'
                    ? `/admin/re-exam-portal/${item.studentId}/${item.evaluationId}`
                    : `/teacher/mark-entry/${item.studentId}?evalId=${item.evaluationId}`;

                  return (
                    <tr
                      key={`${item.studentId}-${item.evaluationId}`}
                      className="bg-red-50/40 dark:bg-red-950/10 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#002045] dark:text-white whitespace-nowrap">
                        {item.studentName}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.grade}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-primary whitespace-nowrap">
                        {item.subject}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={item.templateName}>
                        {item.templateName}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                          {item.marksObtained} / {item.passMarks}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300">
                          Failed
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={viewHref}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-border transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
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
  );
}
