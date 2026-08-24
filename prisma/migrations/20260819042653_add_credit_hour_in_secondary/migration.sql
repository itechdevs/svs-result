/*
  Warnings:

  - You are about to drop the column `creditHours` on the `secondary_subject_configs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subjectConfigId,type,displayOrder]` on the table `secondary_subject_components` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "secondary_subject_components_subjectConfigId_type_key";

-- AlterTable
ALTER TABLE "secondary_subject_components" ADD COLUMN     "creditHour" DECIMAL(4,2) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "secondary_subject_configs" DROP COLUMN "creditHours";

-- CreateIndex
CREATE INDEX "secondary_subject_components_subjectConfigId_idx" ON "secondary_subject_components"("subjectConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_subject_components_subjectConfigId_type_displayOr_key" ON "secondary_subject_components"("subjectConfigId", "type", "displayOrder");
