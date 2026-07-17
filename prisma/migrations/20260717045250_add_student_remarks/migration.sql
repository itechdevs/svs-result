-- CreateTable
CREATE TABLE "student_remarks" (
    "id" TEXT NOT NULL,
    "syncedStudentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_remarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_remarks_examId_idx" ON "student_remarks"("examId");

-- CreateIndex
CREATE INDEX "student_remarks_syncedStudentId_idx" ON "student_remarks"("syncedStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_remarks_syncedStudentId_examId_key" ON "student_remarks"("syncedStudentId", "examId");

-- AddForeignKey
ALTER TABLE "student_remarks" ADD CONSTRAINT "student_remarks_syncedStudentId_fkey" FOREIGN KEY ("syncedStudentId") REFERENCES "synced_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_remarks" ADD CONSTRAINT "student_remarks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_remarks" ADD CONSTRAINT "student_remarks_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex: skip — index may not exist with this name in all environments
