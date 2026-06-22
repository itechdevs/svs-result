/*
  Warnings:

  - You are about to drop the column `teacherId` on the `synced_subjects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "synced_subjects" DROP CONSTRAINT "synced_subjects_teacherId_fkey";

-- DropIndex
DROP INDEX "synced_subjects_teacherId_idx";

-- AlterTable
ALTER TABLE "synced_subjects" DROP COLUMN "teacherId";

-- CreateTable
CREATE TABLE "_SyncedSubjectToSyncedTeacher" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SyncedSubjectToSyncedTeacher_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SyncedSubjectToSyncedTeacher_B_index" ON "_SyncedSubjectToSyncedTeacher"("B");

-- AddForeignKey
ALTER TABLE "_SyncedSubjectToSyncedTeacher" ADD CONSTRAINT "_SyncedSubjectToSyncedTeacher_A_fkey" FOREIGN KEY ("A") REFERENCES "synced_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SyncedSubjectToSyncedTeacher" ADD CONSTRAINT "_SyncedSubjectToSyncedTeacher_B_fkey" FOREIGN KEY ("B") REFERENCES "synced_teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
