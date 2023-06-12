/*
  Warnings:

  - Added the required column `timestamp` to the `Blob` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `timestamp` on the `Block` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `timestamp` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blob" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Block" DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "BlockOverallStats" (
    "id" SERIAL NOT NULL,
    "totalBlocks" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockDailyStats" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "totalBlocks" INTEGER NOT NULL,

    CONSTRAINT "BlockDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionOverallStats" (
    "id" SERIAL NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDailyStats" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "totalTransactions" INTEGER NOT NULL,

    CONSTRAINT "TransactionDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobOverallStats" (
    "id" SERIAL NOT NULL,
    "totalBlobs" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlobOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobDailyStats" (
    "id" SERIAL NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "totalBlobs" INTEGER NOT NULL,

    CONSTRAINT "BlobDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockDailyStats_day_idx" ON "BlockDailyStats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "BlockDailyStats_day_key" ON "BlockDailyStats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDailyStats_day_key" ON "TransactionDailyStats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "BlobDailyStats_day_key" ON "BlobDailyStats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Block_timestamp_key" ON "Block"("timestamp");
