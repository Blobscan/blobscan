/*
  Warnings:

  - The primary key for the `Blob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `index` on the `Blob` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Blob` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Blob` table. All the data in the column will be lost.
  - You are about to drop the `BlobData` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[versionedHash]` on the table `Blob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[commitment]` on the table `Blob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gsUri]` on the table `Blob` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[swarmHash]` on the table `Blob` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gsUri` to the `Blob` table without a default value. This is not possible if the table is not empty.
  - Added the required column `swarmHash` to the `Blob` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_txHash_fkey";

-- DropForeignKey
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_versionedHash_fkey";

-- DropIndex
DROP INDEX "Blob_txHash_index_key";

-- AlterTable
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_pkey",
DROP COLUMN "index",
DROP COLUMN "timestamp",
DROP COLUMN "txHash",
ADD COLUMN     "gsUri" TEXT NOT NULL,
ADD COLUMN     "swarmHash" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Blob_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Blob_id_seq";

-- DropTable
DROP TABLE "BlobData";

-- CreateTable
CREATE TABLE "BlobsOnTransactions" (
    "blobHash" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "BlobsOnTransactions_pkey" PRIMARY KEY ("txHash","index")
);

-- CreateIndex
CREATE UNIQUE INDEX "Blob_versionedHash_key" ON "Blob"("versionedHash");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_commitment_key" ON "Blob"("commitment");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_gsUri_key" ON "Blob"("gsUri");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_swarmHash_key" ON "Blob"("swarmHash");

-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
