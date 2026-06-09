'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EvaluationPlan, Student, ReExam, Allocation, StudentOutcomeMark, OutcomeMark, TeacherAssignment } from '@/types/academic';
import {
  INITIAL_STUDENTS,
  INITIAL_EVALUATIONS,
  INITIAL_RE_EXAMS,
  INITIAL_ALLOCATIONS,
  INITIAL_STUDENT_MARKS,
  INITIAL_TEACHER_ASSIGNMENTS,
} from '@/constants/mockData';

interface TaskGroup {
  taskType: string;
  max: number;
  pass: number;
  outcomes: { name: string; date: string; max: number; pass: number }[];
}

// ── Calculation helpers (pure, exported for reuse) ────────────

/** Sum of regularMark across all outcomes for a student+evaluation */
export function calcObtainedMarks(
  studentMarks: StudentOutcomeMark | undefined,
  outcomes: { name: string }[]
): number {
  if (!studentMarks) return 0;
  return outcomes.reduce((sum, lo) => {
    const m = studentMarks.outcomeMarks[lo.name];
    return sum + (m?.regularMark ?? 0);
  }, 0);
}

/** Full marks total from outcomes array */
export function calcFullMarks(outcomes: { fullMarks?: number }[]): number {
  return outcomes.reduce((sum, lo) => sum + (lo.fullMarks ?? 0), 0);
}

/**
 * Pass/fail: FAIL if ANY outcome regularMark < its passMarks.
 * Returns 'Pass' | 'Fail' | 'Pending' (no marks entered yet).
 */
export function calcPassFail(
  studentMarks: StudentOutcomeMark | undefined,
  outcomes: { name: string; passMarks?: number }[]
): 'Pass' | 'Fail' | 'Pending' {
  if (!studentMarks) return 'Pending';
  const allEntered = outcomes.every(lo => {
    const m = studentMarks.outcomeMarks[lo.name];
    return m?.regularMark !== null && m?.regularMark !== undefined;
  });
  if (!allEntered) return 'Pending';
  const anyFail = outcomes.some(lo => {
    const m = studentMarks.outcomeMarks[lo.name];
    return (m?.regularMark ?? 0) < (lo.passMarks ?? 0);
  });
  return anyFail ? 'Fail' : 'Pass';
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

  // ── Mark entry central store ──────────────────────────────
  studentMarks: StudentOutcomeMark[];
  getStudentMark: (studentId: string, evaluationId: string) => StudentOutcomeMark | undefined;
  updateOutcomeMark: (
    studentId: string,
    evaluationId: string,
    outcomeName: string,
    patch: Partial<OutcomeMark>
  ) => void;

  // ── Teacher assignments ───────────────────────────────────
  teacherAssignments: TeacherAssignment[];
  /** Classes the current teacher is assigned to */
  assignedClasses: string[];
  /** Subjects assigned to the teacher for a given class */
  subjectsForClass: (className: string) => string[];
  /** Evaluation ID for a given class+subject */
  evaluationForClassSubject: (className: string, subject: string) => string | undefined;
  /** Students enrolled in a specific class */
  studentsForClass: (className: string) => Student[];

  // ── Legacy mark entry (still used by old MarkEntryTab) ────
  selectedEvaluationId: string;
  setSelectedEvaluationId: React.Dispatch<React.SetStateAction<string>>;
  gradingStudentId: string;
  setGradingStudentId: React.Dispatch<React.SetStateAction<string>>;
  updateIndividualRating: (outcomeName: string, value: number, isSupport: boolean) => void;

  // ── Evaluation CRUD ───────────────────────────────────────
  newEvalTitle: string;
  setNewEvalTitle: React.Dispatch<React.SetStateAction<string>>;
  newEvalSubject: string;
  setNewEvalSubject: React.Dispatch<React.SetStateAction<string>>;
  targetMarks: number;
  setTargetMarks: React.Dispatch<React.SetStateAction<number>>;
  newOutcomes: TaskGroup[];
  setNewOutcomes: React.Dispatch<React.SetStateAction<TaskGroup[]>>;
  editingEvaluationId: string | null;
  setEditingEvaluationId: React.Dispatch<React.SetStateAction<string | null>>;
  handleCreateEvaluation: () => void;
  handleUpdateEvaluation: () => void;
  loadEvaluationForEdit: (id: string) => void;

  // ── Re-exam ───────────────────────────────────────────────
  schedulingReExam: ReExam | null;
  setSchedulingReExam: React.Dispatch<React.SetStateAction<ReExam | null>>;
  reExamDate: string;
  setReExamDate: React.Dispatch<React.SetStateAction<string>>;
  reExamTime: string;
  setReExamTime: React.Dispatch<React.SetStateAction<string>>;
  isLockedSchedule: boolean;
  setIsLockedSchedule: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingReExam: boolean;
  setIsSavingReExam: React.Dispatch<React.SetStateAction<boolean>>;

  saveSuccessMessage: boolean;
  setSaveSuccessMessage: React.Dispatch<React.SetStateAction<boolean>>;

  showTranscriptModal: Student | null;
  setShowTranscriptModal: React.Dispatch<React.SetStateAction<Student | null>>;

  toggleTeacherStatus: (id: string) => void;
  handleImportSuccess: () => void;
  handleCompilationComplete: () => void;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export function AcademicProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [evaluations, setEvaluations] = useState<EvaluationPlan[]>(INITIAL_EVALUATIONS);
  const [reExams, setReExams] = useState<ReExam[]>(INITIAL_RE_EXAMS);
  const [allocations, setAllocations] = useState<Allocation[]>(INITIAL_ALLOCATIONS);
  const [studentMarks, setStudentMarks] = useState<StudentOutcomeMark[]>(INITIAL_STUDENT_MARKS);
  const [teacherAssignments] = useState<TeacherAssignment[]>(INITIAL_TEACHER_ASSIGNMENTS);

  const [selectedEvaluationId, setSelectedEvaluationId] = useState('eval-1');
  const [gradingStudentId, setGradingStudentId] = useState('CS-2024-001');

  const [newEvalTitle, setNewEvalTitle] = useState('Term 1 Science Assessment');
  const [newEvalSubject, setNewEvalSubject] = useState('Science');
  const [targetMarks, setTargetMarks] = useState(55);
  const [newOutcomes, setNewOutcomes] = useState<TaskGroup[]>([
    { taskType: 'Written', max: 4, pass: 2, outcomes: [{ name: 'Theory & Principles', date: '2024-05-20', max: 30, pass: 12 }] },
    { taskType: 'Practical Assessment', max: 40, pass: 16, outcomes: [{ name: 'Laboratory Safety & Setup', date: '2024-05-22', max: 25, pass: 10 }] }
  ]);
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);

  const [schedulingReExam, setSchedulingReExam] = useState<ReExam | null>(null);
  const [reExamDate, setReExamDate] = useState('2024-05-15');
  const [reExamTime, setReExamTime] = useState('09:00');
  const [isLockedSchedule, setIsLockedSchedule] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(false);
  const [isSavingReExam, setIsSavingReExam] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState<Student | null>(null);

  // ── Mark entry helpers ──────────────────────────────────────

  const getStudentMark = useCallback(
    (studentId: string, evaluationId: string) =>
      studentMarks.find(m => m.studentId === studentId && m.evaluationId === evaluationId),
    [studentMarks]
  );

  const updateOutcomeMark = useCallback(
    (studentId: string, evaluationId: string, outcomeName: string, patch: Partial<OutcomeMark>) => {
      setStudentMarks(prev => {
        const idx = prev.findIndex(m => m.studentId === studentId && m.evaluationId === evaluationId);
        if (idx === -1) {
          // Create new record
          const newRecord: StudentOutcomeMark = {
            studentId,
            evaluationId,
            outcomeMarks: {
              [outcomeName]: {
                regularMark: null,
                regularDate: '',
                supportMark: null,
                supportDate: '',
                remarks: '',
                ...patch,
              },
            },
          };
          return [...prev, newRecord];
        }
        const updated = [...prev];
        const existing = updated[idx].outcomeMarks[outcomeName] ?? {
          regularMark: null,
          regularDate: '',
          supportMark: null,
          supportDate: '',
          remarks: '',
        };
        updated[idx] = {
          ...updated[idx],
          outcomeMarks: {
            ...updated[idx].outcomeMarks,
            [outcomeName]: { ...existing, ...patch },
          },
        };
        return updated;
      });
    },
    []
  );

  // ── Teacher assignment helpers ──────────────────────────────

  const assignedClasses = [...new Set(teacherAssignments.map(a => a.className))];

  const subjectsForClass = useCallback(
    (className: string) =>
      [...new Set(teacherAssignments.filter(a => a.className === className).map(a => a.subject))],
    [teacherAssignments]
  );

  const evaluationForClassSubject = useCallback(
    (className: string, subject: string) =>
      teacherAssignments.find(a => a.className === className && a.subject === subject)?.evaluationId,
    [teacherAssignments]
  );

  const studentsForClass = useCallback(
    (className: string) => students.filter(s => s.class === className),
    [students]
  );

  // ── Legacy rating update (used by old MarkEntryTab) ─────────

  const updateIndividualRating = useCallback(
    (outcomeName: string, value: number, isSupport: boolean) => {
      setEvaluations(prev =>
        prev.map(item => {
          if (item.id !== selectedEvaluationId) return item;
          return {
            ...item,
            learningOutcomes: item.learningOutcomes.map(lo => {
              if (lo.name !== outcomeName) return lo;
              return isSupport
                ? { ...lo, afterSupportRating: value, supportDate: '2024-05-12' }
                : { ...lo, regularRating: value };
            }),
          };
        })
      );
    },
    [selectedEvaluationId]
  );

  // ── Evaluation CRUD ─────────────────────────────────────────

  const loadEvaluationForEdit = (id: string) => {
    const evaluation = evaluations.find(e => e.id === id);
    if (!evaluation) return;
    setEditingEvaluationId(id);
    setNewEvalTitle(evaluation.title);
    setNewEvalSubject(evaluation.subject);
    const totalOutcomes = evaluation.learningOutcomes.length;
    const marksPerOutcome = totalOutcomes > 0 ? Math.floor(evaluation.fullMarks / totalOutcomes) : 20;
    const passPerOutcome = totalOutcomes > 0 ? Math.floor(evaluation.passMarks / totalOutcomes) : 8;
    const taskGroups = new Map<string, TaskGroup>();
    evaluation.learningOutcomes.forEach(lo => {
      const match = lo.name.match(/^\[(.*?)\]\s*(.*)$/);
      const taskType = match ? match[1] : 'Written';
      const outcomeName = match ? match[2] : lo.name;
      if (!taskGroups.has(taskType)) taskGroups.set(taskType, { taskType, max: 0, pass: 0, outcomes: [] });
      const group = taskGroups.get(taskType)!;
      group.outcomes.push({ name: outcomeName, date: lo.regularDate, max: marksPerOutcome, pass: passPerOutcome });
      group.max += marksPerOutcome;
      group.pass += passPerOutcome;
    });
    setNewOutcomes(Array.from(taskGroups.values()));
  };

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
        supportDate: '',
        fullMarks: Number(item.max),
        passMarks: Number(item.pass),
        taskType: item.taskType,
      })),
    };
    setEvaluations([formatted, ...evaluations]);
  };

  const handleUpdateEvaluation = () => {
    if (!editingEvaluationId) return;
    const flatOutcomes = newOutcomes.flatMap(group =>
      group.outcomes.map(out => ({ ...out, taskType: group.taskType }))
    );
    const totalMax = flatOutcomes.reduce((acc, curr) => acc + Number(curr.max), 0);
    const totalPass = flatOutcomes.reduce((acc, curr) => acc + Number(curr.pass), 0);
    const updated: EvaluationPlan = {
      id: editingEvaluationId,
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
        supportDate: '',
        fullMarks: Number(item.max),
        passMarks: Number(item.pass),
        taskType: item.taskType,
      })),
    };
    setEvaluations(evaluations.map(e => (e.id === editingEvaluationId ? updated : e)));
    setEditingEvaluationId(null);
  };

  // ── Misc ────────────────────────────────────────────────────

  const toggleTeacherStatus = (id: string) => {
    setAllocations(allocations.map(item =>
      item.id === id ? { ...item, status: item.status === 'Active' ? 'Inactive' : 'Active' } : item
    ));
  };

  const handleImportSuccess = () => {
    const newStaff: Allocation[] = [
      { id: 'alloc-new-1', teacher: 'Prof. Albus D.', title: 'Director Emeritus', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', classes: ['Grade 12-A'], subjects: ['Defense Against Dark Arts'], status: 'Active' },
      { id: 'alloc-new-2', teacher: 'Minerva M.', title: 'Deputy Headmistress', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', classes: ['Grade 11-A', 'Grade 12-B'], subjects: ['Transfiguration'], status: 'Active' }
    ];
    setAllocations(prev => [...prev, ...newStaff]);
  };

  const handleCompilationComplete = () => {
    setStudents(prev =>
      prev.map(s =>
        s.id === 'STU-2024-00892'
          ? { ...s, overallPercent: 64.5, overallTotal: '645 / 1000', grade: 'C+ (Satisfactory)', resultStatus: 'PROMOTED', remarks: 'Showed significant improvement in suplemental re-evaluations. Passed probation.' }
          : s
      )
    );
  };

  return (
    <AcademicContext.Provider value={{
      students, setStudents,
      evaluations, setEvaluations,
      reExams, setReExams,
      allocations, setAllocations,
      studentMarks,
      getStudentMark,
      updateOutcomeMark,
      teacherAssignments,
      assignedClasses,
      subjectsForClass,
      evaluationForClassSubject,
      studentsForClass,
      selectedEvaluationId, setSelectedEvaluationId,
      gradingStudentId, setGradingStudentId,
      updateIndividualRating,
      newEvalTitle, setNewEvalTitle,
      newEvalSubject, setNewEvalSubject,
      targetMarks, setTargetMarks,
      newOutcomes, setNewOutcomes,
      editingEvaluationId, setEditingEvaluationId,
      handleCreateEvaluation,
      handleUpdateEvaluation,
      loadEvaluationForEdit,
      schedulingReExam, setSchedulingReExam,
      reExamDate, setReExamDate,
      reExamTime, setReExamTime,
      isLockedSchedule, setIsLockedSchedule,
      isSavingReExam, setIsSavingReExam,
      saveSuccessMessage, setSaveSuccessMessage,
      showTranscriptModal, setShowTranscriptModal,
      toggleTeacherStatus,
      handleImportSuccess,
      handleCompilationComplete,
    } as any}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademicContext() {
  const context = useContext(AcademicContext);
  if (context === undefined) throw new Error('useAcademicContext must be used within an AcademicProvider');
  return context;
}
