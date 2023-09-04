/*
  Warnings:

  - You are about to drop the column `blob_gas_price` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "blob_gas_price";
