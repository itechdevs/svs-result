/*
  Warnings:

  - You are about to drop the `teacher_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_academicYearId_fkey";

-- DropForeignKey
ALTER TABLE "teacher_assignments" DROP CONSTRAINT "teacher_assignments_userId_fkey";

-- AlterTable
ALTER TABLE "synced_subjects" ADD COLUMN     "teacherId" TEXT;

-- DropTable
DROP TABLE "teacher_assignments";

-- CreateIndex
CREATE INDEX "synced_subjects_teacherId_idx" ON "synced_subjects"("teacherId");

-- AddForeignKey
ALTER TABLE "synced_subjects" ADD CONSTRAINT "synced_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "synced_teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
