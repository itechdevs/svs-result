-- CreateEnum
CREATE TYPE "CompilationStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "teacher_subject_compilations" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "syncedSubjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "evaluationTemplateIds" JSONB NOT NULL,
    "status" "CompilationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_subject_compilations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subject_compilation_results" (
    "id" TEXT NOT NULL,
    "compilationId" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "totalFullMarks" DECIMAL(8,2) NOT NULL,
    "obtainedMarks" DECIMAL(8,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT,
    "gradePoint" DECIMAL(3,2),
    "isPassed" BOOLEAN NOT NULL,
    "failedEvaluations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_subject_compilation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_subject_compilations_teacherId_idx" ON "teacher_subject_compilations"("teacherId");

-- CreateIndex
CREATE INDEX "teacher_subject_compilations_syncedSubjectId_idx" ON "teacher_subject_compilations"("syncedSubjectId");

-- CreateIndex
CREATE INDEX "teacher_subject_compilations_academicYearId_idx" ON "teacher_subject_compilations"("academicYearId");

-- CreateIndex
CREATE INDEX "teacher_subject_compilations_status_idx" ON "teacher_subject_compilations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subject_compilations_teacherId_syncedSubjectId_acad_key" ON "teacher_subject_compilations"("teacherId", "syncedSubjectId", "academicYearId", "gradeLevel");

-- CreateIndex
CREATE INDEX "teacher_subject_compilation_results_compilationId_idx" ON "teacher_subject_compilation_results"("compilationId");

-- CreateIndex
CREATE INDEX "teacher_subject_compilation_results_syncedStudentId_idx" ON "teacher_subject_compilation_results"("syncedStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subject_compilation_results_compilationId_syncedStu_key" ON "teacher_subject_compilation_results"("compilationId", "syncedStudentId");

-- AddForeignKey
ALTER TABLE "teacher_subject_compilations" ADD CONSTRAINT "teacher_subject_compilations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_compilations" ADD CONSTRAINT "teacher_subject_compilations_syncedSubjectId_fkey" FOREIGN KEY ("syncedSubjectId") REFERENCES "synced_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_compilations" ADD CONSTRAINT "teacher_subject_compilations_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_compilation_results" ADD CONSTRAINT "teacher_subject_compilation_results_compilationId_fkey" FOREIGN KEY ("compilationId") REFERENCES "teacher_subject_compilations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subject_compilation_results" ADD CONSTRAINT "teacher_subject_compilation_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
