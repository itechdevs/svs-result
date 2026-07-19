export interface OutcomeInput {
  regularMark: number | null | undefined;
  reExamMark: number | null | undefined;
  passMarks: number;
  fullMarks: number;
}

export interface StudentGradeResult {
  obtainedMarks: number;
  fullMarks: number;
  percentage: number;
  isPassed: boolean;
  hasFailure: boolean;
  allEntered: boolean;
  anyEntered: boolean;
  originallyFailedIndices: number[];
  originallyFailedCount: number;
  reExamGivenCount: number;
}

export type ReExamStatus = 'none' | 'needed' | 'partial' | 'given';

export function calcEffectiveMark(
  regularMark: number | null | undefined,
  reExamMark: number | null | undefined,
): number | null {
  if (reExamMark !== null && reExamMark !== undefined) {
    return Math.max(reExamMark, regularMark ?? 0);
  }
  return regularMark ?? null;
}

export function calcObtainedMarks(outcomes: OutcomeInput[]): number {
  return outcomes.reduce((sum, o) => {
    const effective = calcEffectiveMark(o.regularMark, o.reExamMark);
    return sum + (effective ?? 0);
  }, 0);
}

export function calcFullMarks(outcomes: OutcomeInput[]): number {
  return outcomes.reduce((sum, o) => sum + o.fullMarks, 0);
}

export function calcPercentage(obtained: number, full: number): number {
  if (full <= 0) return 0;
  return (obtained / full) * 100;
}

export function calcStudentGrade(outcomes: OutcomeInput[]): StudentGradeResult {
  const fullMarks = calcFullMarks(outcomes);
  const obtainedMarks = calcObtainedMarks(outcomes);
  const percentage = calcPercentage(obtainedMarks, fullMarks);

  const originallyFailedIndices: number[] = [];
  let anyEntered = false;
  let allEntered = outcomes.length > 0;
  let reExamGivenCount = 0;

  outcomes.forEach((o, idx) => {
    const regularEntered = o.regularMark !== null && o.regularMark !== undefined;
    if (regularEntered) anyEntered = true;
    else allEntered = false;

    if (regularEntered && o.regularMark! < o.passMarks) {
      originallyFailedIndices.push(idx);
      if (o.reExamMark !== null && o.reExamMark !== undefined) {
        reExamGivenCount++;
      }
    }
  });

  if (outcomes.length === 0) allEntered = false;

  const failedOutcomeIndices: number[] = [];
  outcomes.forEach((o, idx) => {
    const effective = calcEffectiveMark(o.regularMark, o.reExamMark);
    if (effective !== null && effective < o.passMarks) {
      failedOutcomeIndices.push(idx);
    }
  });

  const hasFailure = failedOutcomeIndices.length > 0;
  const isPassed = anyEntered && !hasFailure && allEntered;

  return {
    obtainedMarks,
    fullMarks,
    percentage,
    isPassed,
    hasFailure,
    allEntered,
    anyEntered,
    originallyFailedIndices,
    originallyFailedCount: originallyFailedIndices.length,
    reExamGivenCount,
  };
}

export function calcReExamStatus(grade: StudentGradeResult): ReExamStatus {
  if (grade.originallyFailedCount === 0) return 'none';
  if (grade.reExamGivenCount === 0) return 'needed';
  if (grade.reExamGivenCount < grade.originallyFailedCount) return 'partial';
  return 'given';
}

export type ResultStatus = 'Pass' | 'Fail' | 'Pending';

export function calcResultStatus(grade: StudentGradeResult): ResultStatus {
  if (!grade.anyEntered) return 'Pending';
  if (!grade.allEntered) return 'Pending';
  if (grade.hasFailure) return 'Fail';
  return 'Pass';
}
