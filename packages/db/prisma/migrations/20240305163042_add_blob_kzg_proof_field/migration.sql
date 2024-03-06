/*
  Warnings:

  - A unique constraint covering the columns `[proof]` on the table `blob` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "blob" ADD COLUMN     "proof" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "blob_proof_key" ON "blob"("proof");
