-- Drop the old unique constraint that doesn't include examId
DROP INDEX IF EXISTS "teacher_subject_compilations_teacherId_syncedSubjectId_acad_key";

-- Create new unique constraint that includes examId
-- NULL examId is treated as a distinct value (NULLS NOT DISTINCT makes NULLs equal)
CREATE UNIQUE INDEX "teacher_subject_compilations_teacherId_syncedSubjectId_exam_key"
  ON "teacher_subject_compilations"("teacherId", "syncedSubjectId", "academicYearId", "gradeLevel", "examId")
  NULLS NOT DISTINCT;
