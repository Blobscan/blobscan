/*
  Warnings:

  - You are about to drop the column `gsUri` on the `Blob` table. All the data in the column will be lost.
  - You are about to drop the column `swarmHash` on the `Blob` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BlobStorage" AS ENUM ('google', 'prisma', 'swarm');

-- DropIndex
DROP INDEX "Blob_gsUri_key";

-- DropIndex
DROP INDEX "Blob_swarmHash_key";

-- AlterTable
ALTER TABLE "Blob" DROP COLUMN "gsUri",
DROP COLUMN "swarmHash";

-- CreateTable
CREATE TABLE "BlobData" (
    "id" SERIAL NOT NULL,
    "blobHash" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "BlobData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobDataStorageReference" (
    "blobHash" TEXT NOT NULL,
    "blobStorage" "BlobStorage" NOT NULL,
    "dataUri" TEXT NOT NULL,

    CONSTRAINT "BlobDataStorageReference_pkey" PRIMARY KEY ("blobHash","blobStorage")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlobData_blobHash_key" ON "BlobData"("blobHash");

-- AddForeignKey
ALTER TABLE "BlobData" ADD CONSTRAINT "BlobData_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobDataStorageReference" ADD CONSTRAINT "BlobDataStorageReference_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;
