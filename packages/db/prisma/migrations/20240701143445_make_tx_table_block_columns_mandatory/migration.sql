/*
  Warnings:

  - Made the column `block_number` on table `transaction` required. This step will fail if there are existing NULL values in that column.
  - Made the column `block_timestamp` on table `transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "transaction" ALTER COLUMN "block_number" SET NOT NULL,
ALTER COLUMN "block_timestamp" SET NOT NULL;
