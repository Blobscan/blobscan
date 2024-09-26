/*
  Warnings:

  - Made the column `tx_index` on table `blobs_on_transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "blobs_on_transactions" ALTER COLUMN "tx_index" SET NOT NULL;
