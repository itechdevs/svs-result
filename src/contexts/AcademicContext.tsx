'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EvaluationPlan, Student, ReExam, Allocation } from '@/types/academic';
import {
  INITIAL_STUDENTS,
  INITIAL_EVALUATIONS,
  INITIAL_RE_EXAMS,
  INITIAL_ALLOCATIONS
} from '@/lib/mockData';

interface TaskGroup {
  taskType: string;
  max: number;
  pass: number;
  outcomes: any[];
}

interface AcademicContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  evaluations: EvaluationPlan[];
  setEvaluations: React.Dispatch<React.SetStateAction<EvaluationPlan[]>>;
  reExams: ReExam[];
  setReExams: React.Dispatch<React.SetStateAction<ReExam[]>>;
  allocations: Allocation[];
  setAllocations: React.Dispatch<React.SetStateAction<Allocation[]>>;

  selectedEvaluationId: string;
  setSelectedEvaluationId: React.Dispatch<React.SetStateAction<string>>;
  gradingStudentId: string;
  setGradingStudentId: React.Dispatch<React.SetStateAction<string>>;

  newEvalTitle: string;
  setNewEvalTitle: React.Dispatch<React.SetStateAction<string>>;
  newEvalSubject: string;
  setNewEvalSubject: React.Dispatch<React.SetStateAction<string>>;
  targetMarks: number;
  setTargetMarks: React.Dispatch<React.SetStateAction<number>>;
  newOutcomes: TaskGroup[];
  setNewOutcomes: React.Dispatch<React.SetStateAction<TaskGroup[]>>;

  schedulingReExam: ReExam | null;
  setSchedulingReExam: React.Dispatch<React.SetStateAction<ReExam | null>>;
  reExamDate: string;
  setReExamDate: React.Dispatch<React.SetStateAction<string>>;
  reExamTime: string;
  setReExamTime: React.Dispatch<React.SetStateAction<string>>;
  isLockedSchedule: boolean;
  setIsLockedSchedule: React.Dispatch<React.SetStateAction<boolean>>;
  saveSuccessMessage: boolean;
  setSaveSuccessMessage: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingReExam: boolean;
  setIsSavingReExam: React.Dispatch<React.SetStateAction<boolean>>;

  showTranscriptModal: Student | null;
  setShowTranscriptModal: React.Dispatch<React.SetStateAction<Student | null>>;

  handleCreateEvaluation: () => void;
  toggleTeacherStatus: (id: string) => void;
  updateIndividualRating: (outcomeName: string, value: number, isSupport: boolean) => void;
  handleImportSuccess: () => void;
  handleCompilationComplete: () => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [evaluations, setEvaluations] = useState<EvaluationPlan[]>(INITIAL_EVALUATIONS);
  const [reExams, setReExams] = useState<ReExam[]>(INITIAL_RE_EXAMS);
  const [allocations, setAllocations] = useState<Allocation[]>(INITIAL_ALLOCATIONS);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState('eval-1');
  const [gradingStudentId, setGradingStudentId] = useState('CS-2024-001');

  const [newEvalTitle, setNewEvalTitle] = useState('Term 1 Science Assessment');
  const [newEvalSubject, setNewEvalSubject] = useState('Science');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([
    {
      taskType: 'Written Examination',
      max: 60,
      pass: 24,
      outcomes: [
        { name: 'Theory & Principles', date: '2024-05-20', max: 30, pass: 12 },
      ]
    },
    {
      taskType: 'Practical Assessment',
      max: 40,
      pass: 16,
      outcomes: [
        { name: 'Laboratory Safety & Setup', date: '2024-05-22', max: 25, pass: 10 }
      ]
    }
  ]);

  const [schedulingReExam, setSchedulingReExam] = useState<ReExam | null>(null);
  const [reExamDate, setReExamDate] = useState('2024-05-15');
  const [reExamTime, setReExamTime] = useState('09:00');
  const [isLockedSchedule, setIsLockedSchedule] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [isSavingReExam, setIsSavingReExam] = useState(false);

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
      unit: '',
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

  const handleImportSuccess = () => {
    const newStaff: Allocation[] = [
      { id: 'alloc-new-1', teacher: 'Prof. Albus D.', title: 'Director Emeritus', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', classes: ['Grade 12-A'], subjects: ['Defense Against Dark Arts'], status: 'Active' },
      { id: 'alloc-new-2', teacher: 'Minerva M.', title: 'Deputy Headmistress', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', classes: ['Grade 11-A', 'Grade 12-B'], subjects: ['Transfiguration'], status: 'Active' }
    ];
    setAllocations(prev => [...prev, ...newStaff]);
  };

  const handleCompilationComplete = () => {
    setStudents(prev => prev.map(s => {
      if (s.id === 'STU-2024-00892') {
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
    <AcademicContext.Provider value={{
      students, setStudents,
      evaluations, setEvaluations,
      reExams, setReExams,
      allocations, setAllocations,
      selectedEvaluationId, setSelectedEvaluationId,
      gradingStudentId, setGradingStudentId,
      newEvalTitle, setNewEvalTitle,
      newEvalSubject, setNewEvalSubject,
      targetMarks, setTargetMarks,
      newOutcomes, setNewOutcomes,
      schedulingReExam, setSchedulingReExam,
      reExamDate, setReExamDate,
      reExamTime, setReExamTime,
      isLockedSchedule, setIsLockedSchedule,
      saveSuccessMessage, setSaveSuccessMessage,
      isSavingReExam, setIsSavingReExam,
      showTranscriptModal, setShowTranscriptModal,
      handleCreateEvaluation,
      toggleTeacherStatus,
      updateIndividualRating,
      handleImportSuccess,
      handleCompilationComplete
    } as any}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademicContext() {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademicContext must be used within an AcademicProvider');
  }
  return context;
}
