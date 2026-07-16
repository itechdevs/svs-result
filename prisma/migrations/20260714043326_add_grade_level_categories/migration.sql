-- CreateEnum
CREATE TYPE "SchoolLevel" AS ENUM ('PRE_PRIMARY', 'PRIMARY', 'SECONDARY', 'HIGHER');

-- AlterTable
ALTER TABLE "secondary_practical_headings" ADD COLUMN     "passMarks" DECIMAL(6,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "grade_level_categories" (
    "id" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "schoolLevel" "SchoolLevel" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_level_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_level_categories_gradeLevel_key" ON "grade_level_categories"("gradeLevel");
