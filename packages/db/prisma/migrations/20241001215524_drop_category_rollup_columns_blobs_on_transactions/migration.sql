/*
  Warnings:

  - You are about to drop the column `category` on the `blobs_on_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `rollup` on the `blobs_on_transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blobs_on_transactions" DROP COLUMN "category",
DROP COLUMN "rollup";
