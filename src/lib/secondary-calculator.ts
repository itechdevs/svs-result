/**
 * NEB v2 — Credit-Hour-Based Secondary Result Calculator
 *
 * Rules implemented (from confirmed NEB v2 spec + school document):
 *   1. Each component (Theory / Practical / Internal) has its own creditHour.
 *   2. Component percentage  = (obtained ÷ fullMarks) × 100
 *   3. Component grade / GP  = lookup on NEB v2 grade scale
 *   4. Subject GPA           = Σ(component.gp × component.ch) ÷ Σ(component.ch)
 *   5. Overall GPA (per exam)= Σ(component.gp × component.ch, all subjects) ÷ Σ(all component.ch)
 *   6. Term-to-term blending via weightage is NOT performed here.
 *      Each exam (First Term / Second Term / Final) is a self-contained calculation.
 *   7. Annual Result Compilation = display layer only; it does NOT re-blend term GPAs.
 *
 * ⚠ Requires confirmation from official NEB v2 specification:
 *   - Whether NG in one component forces subject-level NG regardless of aggregate.
 *   - Whether Overall GPA denominator excludes optional/elective subjects.
 *   - Exact pass percentage for Internal component (assumed 40% here).
 */

import { getSecondaryGrade } from "./secondary-grades";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface ComponentInput {
  /** DB id of SecondarySubjectComponent */
  componentId: string;
  type: "THEORY" | "PRACTICAL" | "INTERNAL";
  fullMarks: number;
  passMarks: number;
  /** NEB v2: credit hour is per-component, not per-subject */
  creditHour: number;
  /** Obtained marks for this student in this exam */
  obtained: number | null; // null = absent
}

export interface SubjectInput {
  subjectConfigId: string;
  subjectName: string;
  components: ComponentInput[];
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ComponentResult {
  componentId: string;
  type: "THEORY" | "PRACTICAL" | "INTERNAL";
  fullMarks: number;
  passMarks: number;
  creditHour: number;
  obtained: number | null;
  isAbsent: boolean;
  /** (obtained / fullMarks) × 100 */
  percentage: number | null;
  grade: string | null;
  gradePoint: number | null;
  isNG: boolean;
  /** gradePoint × creditHour — used in GPA numerator */
  weightedPoint: number | null;
  isPassed: boolean;
}

export interface SubjectResult {
  subjectConfigId: string;
  subjectName: string;
  components: ComponentResult[];
  /** Σ(component.ch) for this subject */
  totalCreditHours: number;
  /** Σ(component.gp × component.ch) / Σ(component.ch) */
  subjectGpa: number | null;
  subjectGrade: string | null;
  isNG: boolean;
  /** True only if ALL components are passed */
  isPassed: boolean;
  /** Snapshot for DB row: total obtained and full marks across components */
  totalObtained: number;
  totalFullMarks: number;
  /** Overall subject percentage (total obtained / total full × 100) */
  subjectPercentage: number | null;
}

export interface ExamResult {
  /** Per-subject breakdown */
  subjects: SubjectResult[];
  /** Σ(all component ch) across all subjects */
  totalCreditHours: number;
  /** Σ(component.gp × component.ch) across all subjects and components */
  totalWeightedPoints: number;
  /**
   * Overall GPA for this exam.
   * Formula: totalWeightedPoints / totalCreditHours
   * Denominator = ALL components of ALL subjects (no optional exclusion).
   * ⚠ Requires confirmation: whether elective/optional subjects are excluded.
   */
  overallGpa: number | null;
  overallGrade: string | null;
  passedSubjects: number;
  ngSubjects: number;
  totalSubjects: number;
  hasNG: boolean;
}

// ---------------------------------------------------------------------------
// Core calculation functions
// ---------------------------------------------------------------------------

/**
 * Calculate a single component's result.
 *
 * Percentage  = (obtained / fullMarks) × 100
 * Grade / GP  = NEB v2 grade scale lookup
 * isPassed    = obtained >= passMarks  (component-level pass rule)
 */
export function calculateComponent(input: ComponentInput): ComponentResult {
  const isAbsent = input.obtained === null || input.obtained === undefined;

  if (isAbsent) {
    return {
      componentId: input.componentId,
      type: input.type,
      fullMarks: input.fullMarks,
      passMarks: input.passMarks,
      creditHour: input.creditHour,
      obtained: null,
      isAbsent: true,
      percentage: null,
      grade: "NG",
      gradePoint: 0,
      isNG: true,
      weightedPoint: 0, // absent counts as 0 in GPA numerator
      isPassed: false,
    };
  }

  const obtained = input.obtained as number;
  const percentage = (obtained / input.fullMarks) * 100;
  const scale = getSecondaryGrade(percentage);

  const gradePoint = scale.gradePoint;
  const weightedPoint = gradePoint * input.creditHour;

  return {
    componentId: input.componentId,
    type: input.type,
    fullMarks: input.fullMarks,
    passMarks: input.passMarks,
    creditHour: input.creditHour,
    obtained,
    isAbsent: false,
    percentage: round2(percentage),
    grade: scale.grade,
    gradePoint,
    isNG: scale.isNG,
    weightedPoint: round2(weightedPoint),
    isPassed: obtained >= input.passMarks,
  };
}

/**
 * Calculate a single subject's result from its components.
 *
 * Subject GPA = Σ(component.gp × component.ch) ÷ Σ(component.ch)
 *
 * Subject isNG  = true if ANY component is NG
 * Subject isPassed = true only if ALL components are passed
 *
 * ⚠ NEB v2 confirmation needed: whether a subject with aggregate >= pass
 *   but one NG component is treated as NG_BLOCKED or just FAILED.
 */
export function calculateSubject(input: SubjectInput): SubjectResult {
  const componentResults = input.components.map(calculateComponent);

  const totalCreditHours = input.components.reduce(
    (sum, c) => sum + c.creditHour,
    0
  );

  // Weighted numerator: Σ(gp × ch)
  const weightedNumerator = componentResults.reduce(
    (sum, c) => sum + (c.weightedPoint ?? 0),
    0
  );

  const isNG = componentResults.some((c) => c.isNG);
  const isPassed = componentResults.every((c) => c.isPassed);

  const calculatedGpa = totalCreditHours > 0 ? round2(weightedNumerator / totalCreditHours) : null;

  // Compute subject totals first so we can derive grade from percentage
  const totalObtained = componentResults.reduce(
    (sum, c) => sum + (c.obtained ?? 0),
    0
  );
  const totalFullMarks = input.components.reduce(
    (sum, c) => sum + c.fullMarks,
    0
  );
  const subjectPercentage =
    totalFullMarks > 0 ? round2((totalObtained / totalFullMarks) * 100) : null;

  // NEB Rule: subject grade is derived from the subject's overall percentage
  // (total obtained / total full marks × 100), matching the official NEB table.
  // If any component is NG, the subject GPA is 0 and grade is NG.
  const subjectGpa = isNG ? 0 : calculatedGpa;
  const subjectGrade = isNG
    ? "NG"
    : subjectPercentage !== null
    ? getSecondaryGrade(subjectPercentage).grade
    : null;

  return {
    subjectConfigId: input.subjectConfigId,
    subjectName: input.subjectName,
    components: componentResults,
    totalCreditHours,
    subjectGpa,
    subjectGrade,
    isNG,
    isPassed,
    totalObtained,
    totalFullMarks,
    subjectPercentage,
  };
}

/**
 * Calculate the full exam result for a student across all subjects.
 *
 * Overall GPA = Σ(component.gp × component.ch, across ALL subjects)
 *             ÷ Σ(component.ch, across ALL subjects)
 *
 * This is scoped to ONE exam (e.g., First Term Exam).
 * It does NOT blend across terms.
 */
export function calculateExam(subjects: SubjectInput[]): ExamResult {
  const subjectResults = subjects.map(calculateSubject);

  // Flatten all components across all subjects for overall GPA
  const allComponents = subjectResults.flatMap((s) => s.components);

  const totalCreditHours = allComponents.reduce(
    (sum, c) => sum + c.creditHour,
    0
  );
  const totalWeightedPoints = allComponents.reduce(
    (sum, c) => sum + (c.weightedPoint ?? 0),
    0
  );

  const overallGpa =
    totalCreditHours > 0
      ? round2(totalWeightedPoints / totalCreditHours)
      : null;

  const overallGrade =
    overallGpa !== null ? getGradeFromGP(overallGpa) : null;

  const ngSubjects = subjectResults.filter((s) => s.isNG).length;
  const passedSubjects = subjectResults.filter((s) => s.isPassed).length;

  let finalOverallGpa = overallGpa;
  let finalOverallGrade = overallGrade;

  // Rule: If 1 or more subjects fail, force overall GPA to 0 and grade to NG.
  if (ngSubjects > 0) {
    finalOverallGpa = 0;
    finalOverallGrade = "NG";
  }

  return {
    subjects: subjectResults,
    totalCreditHours,
    totalWeightedPoints: round2(totalWeightedPoints),
    overallGpa: finalOverallGpa,
    overallGrade: finalOverallGrade,
    passedSubjects,
    ngSubjects,
    totalSubjects: subjectResults.length,
    hasNG: ngSubjects > 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Reverse-lookup: given a computed GPA value, find the grade letter.
 * NEB v2 scale is percentage → GP, so this maps GP back to a letter
 * by finding the grade whose GP matches.
 *
 * ⚠ Requires confirmation: whether the transcript shows the subject's
 *   percentage-derived grade or the GPA-derived grade.
 */
function getGradeFromGP(gp: number): string {
  // Round to 2 decimal places to avoid floating point issues
  const roundedGp = Math.round(gp * 100) / 100;
  
  // Per NEB v2 Guidelines: GP thresholds are upper bounds for lower grades.
  // Example: GPA 3.2 is B+, but GPA 3.21 is A.
  if (roundedGp > 3.6) return "A+"; // 3.61 - 4.00
  if (roundedGp > 3.2) return "A";  // 3.21 - 3.60
  if (roundedGp > 2.8) return "B+"; // 2.81 - 3.20
  if (roundedGp > 2.4) return "B";  // 2.41 - 2.80
  if (roundedGp > 2.0) return "C+"; // 2.01 - 2.40
  if (roundedGp > 1.6) return "C";  // 1.61 - 2.00
  if (roundedGp >= 1.6) return "D"; // Exactly 1.60
  
  return "NG";
}

// ---------------------------------------------------------------------------
// Worked Example (mirrors the NEB v2 spec confirmed examples)
// ---------------------------------------------------------------------------
//
// English:
//   Theory   fullMarks=75, obtained=60, creditHour=2
//   Practical fullMarks=25, obtained=18, creditHour=1
//
//   Theory  %  = (60/75)×100 = 80.00  → Grade A  → GP 3.6 → weighted = 3.6×2 = 7.2
//   Practical % = (18/25)×100 = 72.00  → Grade B+ → GP 3.2 → weighted = 3.2×1 = 3.2
//   Subject GPA = (7.2 + 3.2) / (2 + 1) = 10.4 / 3 = 3.47
//
// Mathematics:
//   Theory   fullMarks=75, obtained=60, creditHour=3
//   Practical fullMarks=25, obtained=18, creditHour=2
//
//   Theory  %  = 80.00 → GP 3.6 → weighted = 3.6×3 = 10.8
//   Practical % = 72.00 → GP 3.2 → weighted = 3.2×2 =  6.4
//   Subject GPA = (10.8 + 6.4) / (3 + 2) = 17.2 / 5 = 3.44
//
// Overall GPA = (7.2 + 3.2 + 10.8 + 6.4) / (2 + 1 + 3 + 2)
//             = 27.6 / 8
//             = 3.45
