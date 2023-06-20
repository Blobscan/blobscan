/*
  Warnings:

  - You are about to drop the column `data` on the `Blob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Blob" DROP COLUMN "data";

-- CreateTable
CREATE TABLE "BlobData" (
    "id" TEXT NOT NULL,
    "versionedHash" TEXT NOT NULL,
    "gsUri" TEXT NOT NULL,
    "swarmHash" TEXT NOT NULL,

    CONSTRAINT "BlobData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlobData_versionedHash_key" ON "BlobData"("versionedHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlobData_gsUri_key" ON "BlobData"("gsUri");

-- CreateIndex
CREATE UNIQUE INDEX "BlobData_swarmHash_key" ON "BlobData"("swarmHash");

-- AddForeignKey
ALTER TABLE "Blob" ADD CONSTRAINT "Blob_versionedHash_fkey" FOREIGN KEY ("versionedHash") REFERENCES "BlobData"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;
