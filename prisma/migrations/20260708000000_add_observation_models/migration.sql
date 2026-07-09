-- CreateTable
CREATE TABLE "observation_categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_items" (
    "id" TEXT NOT NULL,
    "observationCategoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "observation_categories_displayOrder_idx" ON "observation_categories"("displayOrder");

-- CreateIndex
CREATE INDEX "observation_items_observationCategoryId_displayOrder_idx" ON "observation_items"("observationCategoryId", "displayOrder");

-- AddForeignKey
ALTER TABLE "observation_items" ADD CONSTRAINT "observation_items_observationCategoryId_fkey" FOREIGN KEY ("observationCategoryId") REFERENCES "observation_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
