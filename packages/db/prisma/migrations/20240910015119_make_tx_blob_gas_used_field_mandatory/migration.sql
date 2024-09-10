/*
  Warnings:

  - Made the column `blob_gas_used` on table `transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "transaction" ALTER COLUMN "blob_gas_used" SET NOT NULL;
