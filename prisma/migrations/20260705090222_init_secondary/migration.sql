-- CreateEnum
CREATE TYPE "SecondaryComponentType" AS ENUM ('INTERNAL', 'THEORY', 'PRACTICAL');

-- AlterEnum
ALTER TYPE "ResultStatus" ADD VALUE 'NG_BLOCKED';

-- CreateTable
CREATE TABLE "secondary_grade_scales" (
    "id" TEXT NOT NULL,
    "minPercent" DECIMAL(5,2) NOT NULL,
    "maxPercent" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "isNG" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "secondary_grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_subject_configs" (
    "id" TEXT NOT NULL,
    "syncedSubjectId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "creditHours" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_subject_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_subject_components" (
    "id" TEXT NOT NULL,
    "subjectConfigId" TEXT NOT NULL,
    "type" "SecondaryComponentType" NOT NULL,
    "fullMarks" DECIMAL(6,2) NOT NULL,
    "passMarks" DECIMAL(6,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_subject_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_practical_headings" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullMarks" DECIMAL(6,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_practical_headings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_practical_heading_marks" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "headingId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "marksObtained" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_practical_heading_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_component_marks" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "marksObtained" DECIMAL(6,2),
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "MarksStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_component_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_subject_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "subjectConfigId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "internalMarks" DECIMAL(6,2),
    "theoryMarks" DECIMAL(6,2),
    "practicalMarks" DECIMAL(6,2),
    "totalObtained" DECIMAL(8,2) NOT NULL,
    "totalFullMarks" DECIMAL(8,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "isNG" BOOLEAN NOT NULL DEFAULT false,
    "creditHours" INTEGER NOT NULL,
    "weightedPoint" DECIMAL(6,2) NOT NULL,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalResultId" TEXT,

    CONSTRAINT "secondary_subject_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_term_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "totalSubjects" INTEGER NOT NULL,
    "passedSubjects" INTEGER NOT NULL,
    "ngSubjects" INTEGER NOT NULL,
    "totalCreditHours" INTEGER NOT NULL,
    "totalWeightedPoints" DECIMAL(8,2) NOT NULL,
    "gpa" DECIMAL(4,2) NOT NULL,
    "classRank" INTEGER,
    "resultStatus" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "hasNG" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_term_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_term_weights" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "termName" TEXT NOT NULL,
    "weightPercent" DECIMAL(5,2) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_term_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_annual_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "totalSubjects" INTEGER NOT NULL,
    "passedSubjects" INTEGER NOT NULL,
    "ngSubjects" INTEGER NOT NULL,
    "totalCreditHours" INTEGER NOT NULL,
    "totalWeightedPoints" DECIMAL(8,2) NOT NULL,
    "gpa" DECIMAL(4,2) NOT NULL,
    "classRank" INTEGER,
    "resultStatus" "ResultStatus" NOT NULL DEFAULT 'PENDING',
    "hasNG" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_annual_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_annual_subject_results" (
    "id" TEXT NOT NULL,
    "annualResultId" TEXT NOT NULL,
    "subjectConfigId" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "weightedTotalObtained" DECIMAL(8,2) NOT NULL,
    "weightedTotalFull" DECIMAL(8,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "isNG" BOOLEAN NOT NULL DEFAULT false,
    "creditHours" INTEGER NOT NULL,
    "weightedPoint" DECIMAL(6,2) NOT NULL,
    "remarks" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_annual_subject_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secondary_marksheets" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "termResultId" TEXT,
    "annualResultId" TEXT,
    "examId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_marksheets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secondary_grade_scales_minPercent_maxPercent_key" ON "secondary_grade_scales"("minPercent", "maxPercent");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_subject_configs_syncedSubjectId_academicYearId_gr_key" ON "secondary_subject_configs"("syncedSubjectId", "academicYearId", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_subject_components_subjectConfigId_type_key" ON "secondary_subject_components"("subjectConfigId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_practical_headings_componentId_name_key" ON "secondary_practical_headings"("componentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_practical_heading_marks_syncedStudentId_headingId_key" ON "secondary_practical_heading_marks"("syncedStudentId", "headingId", "examId");

-- CreateIndex
CREATE INDEX "secondary_component_marks_examId_status_idx" ON "secondary_component_marks"("examId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_component_marks_syncedStudentId_componentId_examI_key" ON "secondary_component_marks"("syncedStudentId", "componentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_subject_results_syncedStudentId_subjectConfigId_e_key" ON "secondary_subject_results"("syncedStudentId", "subjectConfigId", "examId");

-- CreateIndex
CREATE INDEX "secondary_term_results_examId_resultStatus_idx" ON "secondary_term_results"("examId", "resultStatus");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_term_results_syncedStudentId_examId_key" ON "secondary_term_results"("syncedStudentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_term_weights_academicYearId_gradeLevel_examId_key" ON "secondary_term_weights"("academicYearId", "gradeLevel", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_annual_results_syncedStudentId_academicYearId_key" ON "secondary_annual_results"("syncedStudentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_annual_subject_results_annualResultId_subjectConf_key" ON "secondary_annual_subject_results"("annualResultId", "subjectConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_marksheets_termResultId_key" ON "secondary_marksheets"("termResultId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_marksheets_annualResultId_key" ON "secondary_marksheets"("annualResultId");

-- AddForeignKey
ALTER TABLE "secondary_subject_configs" ADD CONSTRAINT "secondary_subject_configs_syncedSubjectId_fkey" FOREIGN KEY ("syncedSubjectId") REFERENCES "synced_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_configs" ADD CONSTRAINT "secondary_subject_configs_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_components" ADD CONSTRAINT "secondary_subject_components_subjectConfigId_fkey" FOREIGN KEY ("subjectConfigId") REFERENCES "secondary_subject_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_practical_headings" ADD CONSTRAINT "secondary_practical_headings_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "secondary_subject_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_practical_heading_marks" ADD CONSTRAINT "secondary_practical_heading_marks_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_practical_heading_marks" ADD CONSTRAINT "secondary_practical_heading_marks_headingId_fkey" FOREIGN KEY ("headingId") REFERENCES "secondary_practical_headings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_practical_heading_marks" ADD CONSTRAINT "secondary_practical_heading_marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_component_marks" ADD CONSTRAINT "secondary_component_marks_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_component_marks" ADD CONSTRAINT "secondary_component_marks_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "secondary_subject_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_component_marks" ADD CONSTRAINT "secondary_component_marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_component_marks" ADD CONSTRAINT "secondary_component_marks_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_component_marks" ADD CONSTRAINT "secondary_component_marks_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_results" ADD CONSTRAINT "secondary_subject_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_results" ADD CONSTRAINT "secondary_subject_results_subjectConfigId_fkey" FOREIGN KEY ("subjectConfigId") REFERENCES "secondary_subject_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_results" ADD CONSTRAINT "secondary_subject_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_subject_results" ADD CONSTRAINT "secondary_subject_results_finalResultId_fkey" FOREIGN KEY ("finalResultId") REFERENCES "secondary_term_results"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_results" ADD CONSTRAINT "secondary_term_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_results" ADD CONSTRAINT "secondary_term_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_results" ADD CONSTRAINT "secondary_term_results_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_results" ADD CONSTRAINT "secondary_term_results_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_weights" ADD CONSTRAINT "secondary_term_weights_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_term_weights" ADD CONSTRAINT "secondary_term_weights_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_results" ADD CONSTRAINT "secondary_annual_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_results" ADD CONSTRAINT "secondary_annual_results_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_results" ADD CONSTRAINT "secondary_annual_results_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_subject_results" ADD CONSTRAINT "secondary_annual_subject_results_annualResultId_fkey" FOREIGN KEY ("annualResultId") REFERENCES "secondary_annual_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_subject_results" ADD CONSTRAINT "secondary_annual_subject_results_subjectConfigId_fkey" FOREIGN KEY ("subjectConfigId") REFERENCES "secondary_subject_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_annual_subject_results" ADD CONSTRAINT "secondary_annual_subject_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_marksheets" ADD CONSTRAINT "secondary_marksheets_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_marksheets" ADD CONSTRAINT "secondary_marksheets_termResultId_fkey" FOREIGN KEY ("termResultId") REFERENCES "secondary_term_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_marksheets" ADD CONSTRAINT "secondary_marksheets_annualResultId_fkey" FOREIGN KEY ("annualResultId") REFERENCES "secondary_annual_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_marksheets" ADD CONSTRAINT "secondary_marksheets_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondary_marksheets" ADD CONSTRAINT "secondary_marksheets_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
