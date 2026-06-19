-- AlterTable
ALTER TABLE "evaluation_templates" ADD COLUMN     "examId" TEXT;

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "academicYearId" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exams_academicYearId_gradeLevel_idx" ON "exams"("academicYearId", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "exams_academicYearId_gradeLevel_name_key" ON "exams"("academicYearId", "gradeLevel", "name");

-- CreateIndex
CREATE INDEX "evaluation_templates_examId_idx" ON "evaluation_templates"("examId");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
