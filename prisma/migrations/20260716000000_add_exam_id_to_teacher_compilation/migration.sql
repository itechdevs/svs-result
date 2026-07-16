-- AlterTable: add examId to teacher_subject_compilations
ALTER TABLE "teacher_subject_compilations" ADD COLUMN "examId" TEXT;

-- CreateIndex
CREATE INDEX "teacher_subject_compilations_examId_idx" ON "teacher_subject_compilations"("examId");

-- AddForeignKey
ALTER TABLE "teacher_subject_compilations" ADD CONSTRAINT "teacher_subject_compilations_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
