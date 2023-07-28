/*
  Warnings:

  - You are about to drop the column `gsUri` on the `Blob` table. All the data in the column will be lost.
  - You are about to drop the column `swarmHash` on the `Blob` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Blob_gsUri_key";

-- DropIndex
DROP INDEX "Blob_swarmHash_key";

-- AlterTable
ALTER TABLE "Blob" DROP COLUMN "gsUri",
DROP COLUMN "swarmHash";
