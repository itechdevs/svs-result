export interface LearningOutcome {
  name: string;
  text: string;
  regularRating: number;
  afterSupportRating: number | null;
  regularDate: string;
  supportDate: string;
}

export interface EvaluationPlan {
  id: string;
  title: string;
  subject: string;
  status: string;
  testTypes: string;
  outcomes: string;
  fullMarks: number;
  passMarks: number;
  date: string;
  unit: string;
  learningOutcomes: LearningOutcome[];
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
  academicYear: string;
  overallTotal: string;
  overallPercent: number;
  grade: string;
  resultStatus: string;
  remarks: string;
  scores: StudentScore[];
  dist: Record<string, number>;
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
  classes: string[];
  subjects: string[];
  status: string;
}
