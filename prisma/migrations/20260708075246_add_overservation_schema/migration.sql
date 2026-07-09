-- AlterTable
ALTER TABLE "observation_items" ADD COLUMN     "choices" JSONB;

-- CreateTable
CREATE TABLE "student_observation_results" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "observationItemId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "selectedOption" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_observation_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_observation_results_examId_idx" ON "student_observation_results"("examId");

-- CreateIndex
CREATE INDEX "student_observation_results_syncedStudentId_idx" ON "student_observation_results"("syncedStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_observation_results_syncedStudentId_observationItem_key" ON "student_observation_results"("syncedStudentId", "observationItemId", "examId");

-- AddForeignKey
ALTER TABLE "student_observation_results" ADD CONSTRAINT "student_observation_results_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observation_results" ADD CONSTRAINT "student_observation_results_observationItemId_fkey" FOREIGN KEY ("observationItemId") REFERENCES "observation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observation_results" ADD CONSTRAINT "student_observation_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observation_results" ADD CONSTRAINT "student_observation_results_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
