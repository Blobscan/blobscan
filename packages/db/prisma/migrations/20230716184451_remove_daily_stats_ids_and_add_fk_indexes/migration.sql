/*
  Warnings:

  - The primary key for the `BlobDailyStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BlobDailyStats` table. All the data in the column will be lost.
  - The primary key for the `BlockDailyStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BlockDailyStats` table. All the data in the column will be lost.
  - The primary key for the `TransactionDailyStats` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TransactionDailyStats` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "BlobDailyStats_day_idx";

-- DropIndex
DROP INDEX "BlobDailyStats_day_key";

-- DropIndex
DROP INDEX "TransactionDailyStats_day_idx";

-- DropIndex
DROP INDEX "TransactionDailyStats_day_key";

-- AlterTable
ALTER TABLE "BlobDailyStats" DROP CONSTRAINT "BlobDailyStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "BlobDailyStats_pkey" PRIMARY KEY ("day");

-- AlterTable
ALTER TABLE "BlockDailyStats" DROP CONSTRAINT "BlockDailyStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "BlockDailyStats_pkey" PRIMARY KEY ("day");

-- AlterTable
ALTER TABLE "TransactionDailyStats" DROP CONSTRAINT "TransactionDailyStats_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TransactionDailyStats_pkey" PRIMARY KEY ("day");

-- CreateIndex
CREATE INDEX "BlobsOnTransactions_blobHash_idx" ON "BlobsOnTransactions"("blobHash");

-- CreateIndex
CREATE INDEX "BlobsOnTransactions_txHash_idx" ON "BlobsOnTransactions"("txHash");
