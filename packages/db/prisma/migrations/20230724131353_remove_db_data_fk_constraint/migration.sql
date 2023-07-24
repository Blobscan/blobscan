/*
  Warnings:

  - The primary key for the `BlobData` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `blobHash` on the `BlobData` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlobData" DROP CONSTRAINT "BlobData_blobHash_fkey";

-- DropIndex
DROP INDEX "BlobData_blobHash_key";

-- AlterTable
ALTER TABLE "BlobData" DROP CONSTRAINT "BlobData_pkey",
DROP COLUMN "blobHash",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "BlobData_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BlobData_id_seq";
