/*
  Warnings:

  - You are about to alter the column `blob_gas_used` on the `block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `excess_blob_gas` on the `block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `blob_as_calldata_gas_used` on the `block` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `blob_as_calldata_gas_used` on the `transaction` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "block" ALTER COLUMN "blob_gas_used" SET DATA TYPE INTEGER,
ALTER COLUMN "excess_blob_gas" SET DATA TYPE INTEGER,
ALTER COLUMN "blob_as_calldata_gas_used" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transaction" ALTER COLUMN "blob_as_calldata_gas_used" SET DATA TYPE INTEGER;
