export interface LearningOutcome {
  name: string;
  text: string;
  regularRating: number;
  afterSupportRating: number | null;
  regularDate: string;
  supportDate: string;
  /** Full marks for this specific outcome */
  fullMarks?: number;
  /** Pass marks for this specific outcome */
  passMarks?: number;
  /** Task type group this outcome belongs to */
  taskType?: string;
  /** Reference to the source EvaluationTemplate ID */
  templateId?: string;
}

export interface SubEvaluation {
  id: string;
  name: string;
  fullMarks: number;
  passMarks: number;
  weightage: number;
  scheduledDate?: string;
  taskType?: string;
}

export interface EvaluationPlan {
  id: string;
  title: string;
  /** Teacher-defined topic/chapter title — independent of the assigned subject */
  subjectTitle?: string;
  /** The synced subject name from school DB (for allocation/filtering only) */
  subject: string;
  status: string;
  testTypes: string;
  outcomes: string;
  fullMarks: number;
  passMarks: number;
  date: string;
  /** ISO timestamp of the earliest template in this group — used for newest-first sorting */
  createdAt?: string;
  unit: string;
  learningOutcomes: LearningOutcome[];
  /** All sub-evaluations belonging to this parent group */
  subEvaluations?: SubEvaluation[];
  syncedSubjectId?: string;
  gradeLevel?: string;
  /** All real EvaluationTemplate IDs in this group — used for bulk delete */
  templateIds?: string[];
}

/** Per-student, per-outcome mark record */
export interface StudentOutcomeMark {
  studentId: string;
  evaluationId: string;
  /** Key: LearningOutcome.name */
  outcomeMarks: Record<string, OutcomeMark>;
}

export interface OutcomeMark {
  regularMark: number | null;
  regularDate: string;
  supportMark: number | null;
  supportDate: string;
  reExamMark: number | null;
  reExamDate: string;
  remarks: string;
}

/** Teacher assignment record linking a teacher to class+subject combos */
export interface TeacherAssignment {
  teacherId: string;
  /** e.g. "Grade 10 - Section A" */
  className: string;
  subject: string;
  evaluationId: string;
}

export interface StudentScore {
  subject: string;
  type: string;
  obtained: number;
  max: number;
  pass: boolean;
  failedLOs?: number;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  avatar: string;
  status: string;
  class: string;
  attendance: string;
  department: string;
  overallTotal: string;
  overallPercent: number;
  grade: string;
  resultStatus: string;
  remarks: string;
  scores: StudentScore[];
  dist: Record<string, number>;
  rank?: number;
  examName?: string;
}

export interface ReExamOutcome {
  title: string;
  desc: string;
  weight: string;
  original: string;
  current: number;
  target: number;
}

export interface ReExam {
  id: string;
  name: string;
  roll: string;
  subject: string;
  outcome: string;
  prevMarks: string;
  passMarks: number;
  status: string;
  color: string;
  date: string;
  learningOutcomes: ReExamOutcome[];
}

export interface Allocation {
  id: string;
  teacher: string;
  title: string;
  avatar: string;
  email?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  classTeacherId?: string | null;
  classTeacherClassName?: string | null;
  classes: string[];
  subjects: string[];
  status: string;
}
