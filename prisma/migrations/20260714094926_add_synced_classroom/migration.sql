-- CreateTable
CREATE TABLE "synced_classrooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synced_classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "synced_classrooms_isActive_idx" ON "synced_classrooms"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "synced_classrooms_name_section_key" ON "synced_classrooms"("name", "section");
