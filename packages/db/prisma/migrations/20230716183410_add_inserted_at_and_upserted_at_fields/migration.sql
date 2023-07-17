/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `insertedAt` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insertedAt` to the `Blob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Blob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insertedAt` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insertedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "insertedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Blob" ADD COLUMN     "insertedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Block" ADD COLUMN     "insertedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "timestamp",
ADD COLUMN     "insertedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Address_insertedAt_idx" ON "Address"("insertedAt");

-- CreateIndex
CREATE INDEX "Blob_insertedAt_idx" ON "Blob"("insertedAt");

-- CreateIndex
CREATE INDEX "Block_insertedAt_idx" ON "Block"("insertedAt");

-- CreateIndex
CREATE INDEX "Transaction_insertedAt_idx" ON "Transaction"("insertedAt");
