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

export default function ReExamPortalTab() {
  const { data: profile } = useProfile();
  const { data: studentsData } = useStudents({ limit: 500 });
  const { data: resultsData = [] } = useStudentEvaluationResults({ limit: 2000 });
  const { data: subjectsData = [] } = useSubjects();

  const [selectedClass, setSelectedClass] = useState('_all');
  const [selectedSubject, setSelectedSubject] = useState('_all');

  // Assigned classes from teacher profile
  const assignedClasses = useMemo(() => {
    if (!profile?.teacherAssignments) return [];
    return Array.from(new Set(profile.teacherAssignments.map(a => a.gradeLevel)));
  }, [profile]);

  // Subjects for the selected class
  const subjectsForSelectedClass = useMemo(() => {
    if (selectedClass === '_all') return [];
    const classAssignments = profile?.teacherAssignments.filter(a => a.gradeLevel === selectedClass) ?? [];
    const hasAllSubjects = classAssignments.some(a => a.syncedSubjectId === null);
    const classSubjects = subjectsData.filter(s => s.gradeLevel === selectedClass);
    if (hasAllSubjects) return classSubjects.map(s => s.name);
    const assignedIds = new Set(classAssignments.map(a => a.syncedSubjectId));
    return classSubjects.filter(s => assignedIds.has(s.id)).map(s => s.name);
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
        subject: r.evaluationTemplate ? (
          // subject name comes from the template's syncedSubject via useEvaluationTemplates;
          // here it's not included in the results payload, so we fall back to template name
          r.evaluationTemplate.name
        ) : '—',
        evaluationId: r.evaluationTemplateId,
        resultId: r.id,
        marksObtained: r.marksObtained,
        passMarks: r.evaluationTemplate?.passMarks ?? 0,
        hasReExam: false, // ReExam scheduling is a separate flow
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
          <h1 className="text-2xl font-bold text-[#002045] dark:text-white">Re-Examination Management</h1>
          <p className="text-xs text-slate-500">Coordinate and score supplemental sessions for failed learning outcome targets.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card rounded-xl border border-slate-200 dark:border-border shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Class</label>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter by Subject</label>
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
        <div className="bg-red-50 dark:bg-red-950/20 border border-[#ba1a1a]/10 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900 text-[#ba1a1a] dark:text-red-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Failed</p>
            <h4 className="text-2xl font-extrabold text-[#ba1a1a] dark:text-red-400 mt-1">{filteredItems.length} Students</h4>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pending Grading</p>
            <h4 className="text-2xl font-extrabold text-amber-800 dark:text-amber-400 mt-1">
              {filteredItems.length} Pending
            </h4>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Scheduled</p>
            <h4 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">
              0 Scheduled
            </h4>
          </div>
        </div>
      </div>

      {/* Failed Students Registry */}
      <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-bold text-xs text-[#002045] dark:text-white uppercase tracking-wider">Failed Students Registry</h3>
          <p className="text-[10px] text-slate-400 mt-1">Click View to enter re-exam marks for each student</p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-border max-h-[500px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No failed students found.</div>
          ) : (
            filteredItems.map(item => (
              <div
                key={`${item.studentId}-${item.evaluationId}`}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-[#002045] dark:text-white">{item.studentName}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">{item.rollNumber} · {item.grade}</div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold mt-1">
                    {item.subject} · {item.marksObtained}/{item.passMarks} (Failed)
                  </div>
                </div>
                <Link
                  href={`/teacher/mark-entry/${item.studentId}?evalId=${item.evaluationId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#002045] hover:bg-opacity-90 rounded border transition-colors"
                >
                  <Eye className="w-3 h-3" />
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
