/*
  Warnings:

  - You are about to drop the column `grade` on the `synced_students` table. All the data in the column will be lost.
  - Added the required column `class` to the `synced_students` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "synced_students_grade_section_idx";

-- AlterTable
ALTER TABLE "synced_students" DROP COLUMN "grade",
ADD COLUMN     "class" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "synced_students_class_section_idx" ON "synced_students"("class", "section");
