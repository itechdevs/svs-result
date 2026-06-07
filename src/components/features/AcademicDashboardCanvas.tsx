'use client';

import React, { useState } from 'react';
import { useQueryState } from 'nuqs';
import { AnimatePresence } from 'motion/react';

// Types & Mock Data
import { EvaluationPlan, Student, ReExam, Allocation } from '@/types/academic';
import { 
  INITIAL_STUDENTS, 
  INITIAL_EVALUATIONS, 
  INITIAL_RE_EXAMS, 
  INITIAL_ALLOCATIONS 
} from '@/lib/mockData';

// Tab components
import DashboardTab from './DashboardTab';
import EvaluationsTab from './EvaluationsTab';
import CreateEvaluationTab from './CreateEvaluationTab';
import MarkEntryTab from './MarkEntryTab';
import ReExamPortalTab from './ReExamPortalTab';
import AllocationsTab from './AllocationsTab';
import ResultCompilationTab from './ResultCompilationTab';
import StudentRecordsTab from './StudentRecordsTab';
import TranscriptModal from './TranscriptModal';

interface AcademicDashboardCanvasProps {
  role: string;
}

export default function AcademicDashboardCanvas({ role }: AcademicDashboardCanvasProps) {
  // Use nuqs URL query state for tracking the active tab
  const [currentTab, setCurrentTab] = useQueryState('tab', { 
    defaultValue: 'dashboard',
    parse: (value) => value as any
  });

  // App States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [evaluations, setEvaluations] = useState<EvaluationPlan[]>(INITIAL_EVALUATIONS);
  const [reExams, setReExams] = useState<ReExam[]>(INITIAL_RE_EXAMS);
  const [allocations, setAllocations] = useState<Allocation[]>(INITIAL_ALLOCATIONS);

  // Active sub-selection states
  const [selectedEvaluationId, setSelectedEvaluationId] = useState('eval-1');
  const [gradingStudentId, setGradingStudentId] = useState('CS-2024-001');

  // Custom evaluation creation temporary states
  const [newEvalTitle, setNewEvalTitle] = useState('Term 1 Science Assessment');
  const [newEvalSubject, setNewEvalSubject] = useState('Science');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState([
    {
      taskType: 'Written Examination',
      outcomes: [
        { name: 'Theory & Principles', date: '2024-05-20', max: 30, pass: 12 },
      ]
    },
    {
      taskType: 'Practical Assessment',
      outcomes: [
        { name: 'Laboratory Safety & Setup', date: '2024-05-22', max: 25, pass: 10 }
      ]
    }
  ]);

  // Re-Exam Wizard Detail
  const [schedulingReExam, setSchedulingReExam] = useState<ReExam | null>(null);
  const [reExamDate, setReExamDate] = useState('2024-05-15');
  const [reExamTime, setReExamTime] = useState('09:00');
  const [isLockedSchedule, setIsLockedSchedule] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [isSavingReExam, setIsSavingReExam] = useState(false);

  // Result Compilation and Transcripts controls
  const [showTranscriptModal, setShowTranscriptModal] = useState<Student | null>(null);

  const handleCreateEvaluation = () => {
    const flatOutcomes = newOutcomes.flatMap(group => 
      group.outcomes.map(out => ({ ...out, taskType: group.taskType }))
    );
    const totalMax = flatOutcomes.reduce((acc, curr) => acc + Number(curr.max), 0);
    const totalPass = flatOutcomes.reduce((acc, curr) => acc + Number(curr.pass), 0);
    const newId = `eval-${evaluations.length + 1}`;
    const formatted: EvaluationPlan = {
      id: newId,
      title: newEvalTitle,
      subject: newEvalSubject,
      status: 'Active',
      testTypes: `${newOutcomes.length} Types`,
      outcomes: `${flatOutcomes.length} Outcomes`,
      fullMarks: totalMax,
      passMarks: totalPass,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      unit: 'Dynamic Plan Unit',
      learningOutcomes: flatOutcomes.map(item => ({
        name: `[${item.taskType}] ${item.name}`,
        text: `Evaluate competency and rigorous practical applications for ${item.name}.`,
        regularRating: 3,
        afterSupportRating: null,
        regularDate: item.date,
        supportDate: ''
      }))
    };
    setEvaluations([formatted, ...evaluations]);
    setCurrentTab('evaluations');
  };

  const toggleTeacherStatus = (id: string) => {
    setAllocations(allocations.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return item;
    }));
  };

  const updateIndividualRating = (outcomeName: string, value: number, isSupport: boolean) => {
    setEvaluations(evaluations.map(item => {
      if (item.id === selectedEvaluationId) {
        return {
          ...item,
          learningOutcomes: item.learningOutcomes.map(lo => {
            if (lo.name === outcomeName) {
              if (isSupport) {
                return { ...lo, afterSupportRating: value, supportDate: '2024-05-12' };
              } else {
                return { ...lo, regularRating: value };
              }
            }
            return lo;
          })
        };
      }
      return item;
    }));
  };

  // Callback to simulate Admin creating accounts after Excel validation
  const handleImportSuccess = () => {
    const newStaff: Allocation[] = [
      { id: 'alloc-new-1', teacher: 'Prof. Albus D.', title: 'Director Emeritus', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', classes: ['Grade 12-A'], subjects: ['Defense Against Dark Arts'], status: 'Active' },
      { id: 'alloc-new-2', teacher: 'Minerva M.', title: 'Deputy Headmistress', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', classes: ['Grade 11-A', 'Grade 12-B'], subjects: ['Transfiguration'], status: 'Active' }
    ];
    setAllocations(prev => [...prev, ...newStaff]);
  };

  // Callback to simulate GPA update on students after compilation succeeds
  const handleCompilationComplete = () => {
    setStudents(prev => prev.map(s => {
      if (s.id === 'STU-2024-00892') { // Let's upgrade Sterling's probation status
        return {
          ...s,
          overallPercent: 64.5,
          overallTotal: '645 / 1000',
          grade: 'C+ (Satisfactory)',
          resultStatus: 'PROMOTED',
          remarks: 'Showed significant improvement in suplemental re-evaluations. Passed probation.'
        };
      }
      return s;
    }));
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* 1. DASHBOARD OVERVIEW */}
        {currentTab === 'dashboard' && (
          <DashboardTab
            evaluations={evaluations}
            reExams={reExams}
            setSelectedEvaluationId={setSelectedEvaluationId}
            setCurrentTab={setCurrentTab}
            setSchedulingReExam={setSchedulingReExam}
            setIsLockedSchedule={setIsLockedSchedule}
          />
        )}

        {/* 2. EVALUATIONS LIST */}
        {currentTab === 'evaluations' && (
          <EvaluationsTab
            evaluations={evaluations}
            setSelectedEvaluationId={setSelectedEvaluationId}
            setCurrentTab={setCurrentTab}
            setNewEvalTitle={setNewEvalTitle}
            setNewEvalSubject={setNewEvalSubject}
          />
        )}

        {/* 3. CREATE EVALUATION FORM */}
        {currentTab === 'create-evaluation' && (
          <CreateEvaluationTab
            newEvalTitle={newEvalTitle}
            setNewEvalTitle={setNewEvalTitle}
            newEvalSubject={newEvalSubject}
            setNewEvalSubject={setNewEvalSubject}
            targetMarks={targetMarks}
            setTargetMarks={setTargetMarks}
            newOutcomes={newOutcomes}
            setNewOutcomes={setNewOutcomes}
            handleCreateEvaluation={handleCreateEvaluation}
            setCurrentTab={setCurrentTab}
          />
        )}

        {/* 4. MARK ENTRY CENTER */}
        {currentTab === 'mark-entry' && (
          <MarkEntryTab
            evaluations={evaluations}
            students={students}
            selectedEvaluationId={selectedEvaluationId}
            setSelectedEvaluationId={setSelectedEvaluationId}
            gradingStudentId={gradingStudentId}
            setGradingStudentId={setGradingStudentId}
            saveSuccessMessage={saveSuccessMessage}
            setSaveSuccessMessage={setSaveSuccessMessage}
            updateIndividualRating={updateIndividualRating}
          />
        )}

        {/* 5. RE-EXAM PORTAL */}
        {currentTab === 're-exam-portal' && (
          <ReExamPortalTab
            reExams={reExams}
            schedulingReExam={schedulingReExam}
            setSchedulingReExam={setSchedulingReExam}
            reExamDate={reExamDate}
            setReExamDate={setReExamDate}
            reExamTime={reExamTime}
            setReExamTime={setReExamTime}
            isLockedSchedule={isLockedSchedule}
            setIsLockedSchedule={setIsLockedSchedule}
            saveSuccessMessage={saveSuccessMessage}
            setSaveSuccessMessage={setSaveSuccessMessage}
            isSavingReExam={isSavingReExam}
            setIsSavingReExam={setIsSavingReExam}
          />
        )}

        {/* 6. TEACHER ALLOCATION VIEW (ADMIN ONLY) */}
        {currentTab === 'allocations' && role === 'admin' && (
          <AllocationsTab
            allocations={allocations}
            toggleTeacherStatus={toggleTeacherStatus}
            onImportSuccess={handleImportSuccess}
          />
        )}

        {/* 7. RESULT COMPILATION (ADMIN ONLY) */}
        {currentTab === 'result-compilation' && role === 'admin' && (
          <ResultCompilationTab 
            onCompilationComplete={handleCompilationComplete}
          />
        )}

        {/* 8. STUDENT PERFORMANCE RECORDS */}
        {currentTab === 'student-records' && (
          <StudentRecordsTab
            students={students}
            gradingStudentId={gradingStudentId}
            setGradingStudentId={setGradingStudentId}
            setCurrentTab={setCurrentTab}
            setShowTranscriptModal={setShowTranscriptModal}
            role={role}
          />
        )}

      </AnimatePresence>

      {/* Transcript document preview overlay */}
      <TranscriptModal
        showTranscriptModal={showTranscriptModal}
        setShowTranscriptModal={setShowTranscriptModal}
      />
    </div>
  );
}
