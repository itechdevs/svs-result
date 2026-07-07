-- AlterTable
ALTER TABLE "synced_subjects" ADD COLUMN     "section" TEXT;

-- CreateIndex
CREATE INDEX "synced_subjects_gradeLevel_section_idx" ON "synced_subjects"("gradeLevel", "section");
