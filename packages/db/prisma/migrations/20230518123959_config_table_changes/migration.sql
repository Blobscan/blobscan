/*
  Warnings:

  - You are about to drop the `Config` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "to" DROP NOT NULL;

-- DropTable
DROP TABLE "Config";

-- CreateTable
CREATE TABLE "IndexerMetadata" (
    "id" INTEGER NOT NULL,
    "lastSlot" INTEGER NOT NULL,

    CONSTRAINT "IndexerMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IndexerMetadata_lastSlot_key" ON "IndexerMetadata"("lastSlot");
