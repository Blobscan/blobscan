/*
  Warnings:

  - Made the column `proof` on table `blob` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "blob" ALTER COLUMN "proof" SET NOT NULL;
