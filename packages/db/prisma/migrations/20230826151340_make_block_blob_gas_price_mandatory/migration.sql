/*
  Warnings:

  - Made the column `blob_gas_price` on table `block` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "block" ALTER COLUMN "blob_gas_price" SET NOT NULL;
