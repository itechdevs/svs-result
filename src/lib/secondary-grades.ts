export const SECONDARY_GRADE_SCALE = [
  { min: 90, max: 100, grade: "A+", gradePoint: 4.0, isNG: false },
  { min: 80, max: 89.99, grade: "A", gradePoint: 3.6, isNG: false },
  { min: 70, max: 79.99, grade: "B+", gradePoint: 3.2, isNG: false },
  { min: 60, max: 69.99, grade: "B", gradePoint: 2.8, isNG: false },
  { min: 50, max: 59.99, grade: "C+", gradePoint: 2.4, isNG: false },
  { min: 40, max: 49.99, grade: "C", gradePoint: 2.0, isNG: false },
  { min: 35, max: 39.99, grade: "D", gradePoint: 1.6, isNG: false },
  { min: 0, max: 34.99, grade: "NG", gradePoint: 0.0, isNG: true },
] as const;

export function getSecondaryGrade(percentage: number) {
  // Handle edge cases carefully (like exactly 100)
  for (const scale of SECONDARY_GRADE_SCALE) {
    if (percentage >= scale.min && (percentage <= scale.max || (scale.max === 100 && percentage >= 100))) {
      return scale;
    }
  }

  // Fallback for unexpected values
  if (percentage < 0) return SECONDARY_GRADE_SCALE[SECONDARY_GRADE_SCALE.length - 1]; // NG
  if (percentage > 100) return SECONDARY_GRADE_SCALE[0]; // A+

  return SECONDARY_GRADE_SCALE[SECONDARY_GRADE_SCALE.length - 1]; // Default to NG
}
