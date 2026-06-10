-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "MarksStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ReExamStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('PENDING', 'PROMOTED', 'FAILED', 'PROBATION', 'WITHHELD');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('LETTER', 'GPA', 'DESCRIPTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "syncedTeacherId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "syncedSubjectId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_students" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_teachers" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synced_subjects" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_configs" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "gradeType" "GradeType" NOT NULL DEFAULT 'DESCRIPTIVE',
    "passCriteria" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" TEXT NOT NULL,
    "gradeConfigId" TEXT NOT NULL,
    "minPercent" DECIMAL(5,2) NOT NULL,
    "maxPercent" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DECIMAL(3,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" TEXT NOT NULL,
    "gradeConfigId" TEXT NOT NULL,
    "syncedSubjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullMarks" DECIMAL(6,2) NOT NULL,
    "passMarks" DECIMAL(6,2) NOT NULL,
    "weightage" DECIMAL(5,2) NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_evaluation_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "evaluationTemplateId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "marksObtained" DECIMAL(6,2),
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "isPassed" BOOLEAN,
    "effectiveMarks" DECIMAL(6,2),
    "status" "MarksStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "student_evaluation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "re_exam_schedules" (
    "id" TEXT NOT NULL,
    "evaluationTemplateId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "entryOpenDate" TIMESTAMP(3),
    "entryCloseDate" TIMESTAMP(3),
    "fullMarks" DECIMAL(6,2) NOT NULL,
    "passMarks" DECIMAL(6,2) NOT NULL,
    "status" "ReExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "re_exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "re_exam_enrollments" (
    "id" TEXT NOT NULL,
    "reExamScheduleId" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "re_exam_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "re_exam_results" (
    "id" TEXT NOT NULL,
    "reExamEnrollmentId" TEXT NOT NULL,
    "studentEvaluationResultId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "marksObtained" DECIMAL(6,2) NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "status" "MarksStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "re_exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "syncedSubjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "finalResultId" TEXT,
    "totalFullMarks" DECIMAL(8,2) NOT NULL,
    "obtainedMarks" DECIMAL(8,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT,
    "gradePoint" DECIMAL(3,2),
    "isPassed" BOOLEAN NOT NULL,
    "failedEvaluations" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "final_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "totalSubjects" INTEGER NOT NULL,
    "passedSubjects" INTEGER NOT NULL,
    "failedSubjects" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "cgpa" DECIMAL(4,2),
    "overallGrade" TEXT,
    "classRank" INTEGER,
    "resultStatus" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "final_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marksheets" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "finalResultId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marksheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'success',
    "error" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_syncedTeacherId_key" ON "users"("syncedTeacherId");

-- CreateIndex
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "teacher_assignments_userId_idx" ON "teacher_assignments"("userId");

-- CreateIndex
CREATE INDEX "teacher_assignments_gradeLevel_idx" ON "teacher_assignments"("gradeLevel");

-- CreateIndex
CREATE INDEX "teacher_assignments_academicYearId_idx" ON "teacher_assignments"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_assignments_userId_gradeLevel_syncedSubjectId_acade_key" ON "teacher_assignments"("userId", "gradeLevel", "syncedSubjectId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "synced_students_sourceId_key" ON "synced_students"("sourceId");

-- CreateIndex
CREATE INDEX "synced_students_grade_section_idx" ON "synced_students"("grade", "section");

-- CreateIndex
CREATE INDEX "synced_students_isActive_idx" ON "synced_students"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "synced_teachers_sourceId_key" ON "synced_teachers"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "synced_subjects_sourceId_key" ON "synced_subjects"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "synced_subjects_code_key" ON "synced_subjects"("code");

-- CreateIndex
CREATE INDEX "synced_subjects_gradeLevel_idx" ON "synced_subjects"("gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "grade_configs_academicYearId_idx" ON "grade_configs"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_configs_academicYearId_gradeLevel_key" ON "grade_configs"("academicYearId", "gradeLevel");

-- CreateIndex
CREATE INDEX "grade_scales_gradeConfigId_idx" ON "grade_scales"("gradeConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_gradeConfigId_minPercent_maxPercent_key" ON "grade_scales"("gradeConfigId", "minPercent", "maxPercent");

-- CreateIndex
CREATE INDEX "evaluation_templates_gradeConfigId_idx" ON "evaluation_templates"("gradeConfigId");

-- CreateIndex
CREATE INDEX "evaluation_templates_syncedSubjectId_idx" ON "evaluation_templates"("syncedSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_templates_gradeConfigId_syncedSubjectId_name_key" ON "evaluation_templates"("gradeConfigId", "syncedSubjectId", "name");

-- CreateIndex
CREATE INDEX "student_evaluation_results_syncedStudentId_idx" ON "student_evaluation_results"("syncedStudentId");

-- CreateIndex
CREATE INDEX "student_evaluation_results_evaluationTemplateId_idx" ON "student_evaluation_results"("evaluationTemplateId");

-- CreateIndex
CREATE INDEX "student_evaluation_results_status_idx" ON "student_evaluation_results"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_evaluation_results_syncedStudentId_evaluationTempla_key" ON "student_evaluation_results"("syncedStudentId", "evaluationTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "re_exam_schedules_evaluationTemplateId_key" ON "re_exam_schedules"("evaluationTemplateId");

-- CreateIndex
CREATE INDEX "re_exam_schedules_status_idx" ON "re_exam_schedules"("status");

-- CreateIndex
CREATE INDEX "re_exam_enrollments_reExamScheduleId_idx" ON "re_exam_enrollments"("reExamScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "re_exam_enrollments_reExamScheduleId_syncedStudentId_key" ON "re_exam_enrollments"("reExamScheduleId", "syncedStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "re_exam_results_reExamEnrollmentId_key" ON "re_exam_results"("reExamEnrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "re_exam_results_studentEvaluationResultId_key" ON "re_exam_results"("studentEvaluationResultId");

-- CreateIndex
CREATE INDEX "re_exam_results_reExamEnrollmentId_idx" ON "re_exam_results"("reExamEnrollmentId");

-- CreateIndex
CREATE INDEX "subject_results_syncedStudentId_idx" ON "subject_results"("syncedStudentId");

-- CreateIndex
CREATE INDEX "subject_results_academicYearId_idx" ON "subject_results"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_results_syncedStudentId_syncedSubjectId_academicYea_key" ON "subject_results"("syncedStudentId", "syncedSubjectId", "academicYearId");

-- CreateIndex
CREATE INDEX "final_results_syncedStudentId_idx" ON "final_results"("syncedStudentId");

-- CreateIndex
CREATE INDEX "final_results_academicYearId_resultStatus_idx" ON "final_results"("academicYearId", "resultStatus");

-- CreateIndex
CREATE INDEX "final_results_isPublished_idx" ON "final_results"("isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "final_results_syncedStudentId_academicYearId_key" ON "final_results"("syncedStudentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "marksheets_finalResultId_key" ON "marksheets"("finalResultId");

-- CreateIndex
CREATE INDEX "marksheets_syncedStudentId_idx" ON "marksheets"("syncedStudentId");

-- CreateIndex
CREATE INDEX "marksheets_academicYearId_idx" ON "marksheets"("academicYearId");

-- CreateIndex
CREATE INDEX "sync_logs_entity_sourceId_idx" ON "sync_logs"("entity", "sourceId");

-- CreateIndex
CREATE INDEX "sync_logs_syncedAt_idx" ON "sync_logs"("syncedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_syncedTeacherId_fkey" FOREIGN KEY ("syncedTeacherId") REFERENCES "synced_teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_configs" ADD CONSTRAINT "grade_configs_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_gradeConfigId_fkey" FOREIGN KEY ("gradeConfigId") REFERENCES "grade_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_gradeConfigId_fkey" FOREIGN KEY ("gradeConfigId") REFERENCES "grade_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_syncedSubjectId_fkey" FOREIGN KEY ("syncedSubjectId") REFERENCES "synced_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_results" ADD CONSTRAINT "student_evaluation_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_results" ADD CONSTRAINT "student_evaluation_results_evaluationTemplateId_fkey" FOREIGN KEY ("evaluationTemplateId") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_results" ADD CONSTRAINT "student_evaluation_results_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluation_results" ADD CONSTRAINT "student_evaluation_results_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "re_exam_schedules" ADD CONSTRAINT "re_exam_schedules_evaluationTemplateId_fkey" FOREIGN KEY ("evaluationTemplateId") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "re_exam_enrollments" ADD CONSTRAINT "re_exam_enrollments_reExamScheduleId_fkey" FOREIGN KEY ("reExamScheduleId") REFERENCES "re_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "re_exam_results" ADD CONSTRAINT "re_exam_results_reExamEnrollmentId_fkey" FOREIGN KEY ("reExamEnrollmentId") REFERENCES "re_exam_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "re_exam_results" ADD CONSTRAINT "re_exam_results_studentEvaluationResultId_fkey" FOREIGN KEY ("studentEvaluationResultId") REFERENCES "student_evaluation_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_results" ADD CONSTRAINT "subject_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_results" ADD CONSTRAINT "subject_results_syncedSubjectId_fkey" FOREIGN KEY ("syncedSubjectId") REFERENCES "synced_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_results" ADD CONSTRAINT "subject_results_finalResultId_fkey" FOREIGN KEY ("finalResultId") REFERENCES "final_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_results" ADD CONSTRAINT "final_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_results" ADD CONSTRAINT "final_results_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_results" ADD CONSTRAINT "final_results_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_finalResultId_fkey" FOREIGN KEY ("finalResultId") REFERENCES "final_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marksheets" ADD CONSTRAINT "marksheets_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
