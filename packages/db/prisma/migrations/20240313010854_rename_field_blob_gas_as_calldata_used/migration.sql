/*
  Warnings:

  - You are about to drop the column `blob_as_calldata_gas_used` on the `block` table. All the data in the column will be lost.
  - You are about to drop the column `total_blob_as_calldata_gas_used` on the `block_daily_stats` table. All the data in the column will be lost.
  - You are about to drop the column `total_blob_as_calldata_gas_used` on the `block_overall_stats` table. All the data in the column will be lost.
  - You are about to drop the column `blob_as_calldata_gas_used` on the `transaction` table. All the data in the column will be lost.
  - Added the required column `blob_gas_as_calldata_used` to the `block` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_gas_as_calldata_used` to the `block_daily_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_blob_gas_as_calldata_used` to the `block_overall_stats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blob_gas_as_calldata_used` to the `transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "block" DROP COLUMN "blob_as_calldata_gas_used",
ADD COLUMN     "blob_gas_as_calldata_used" DECIMAL(100,0) NOT NULL;

-- AlterTable
ALTER TABLE "block_daily_stats" DROP COLUMN "total_blob_as_calldata_gas_used",
ADD COLUMN     "total_blob_gas_as_calldata_used" DECIMAL(100,0) NOT NULL;

-- AlterTable
ALTER TABLE "block_overall_stats" DROP COLUMN "total_blob_as_calldata_gas_used",
ADD COLUMN     "total_blob_gas_as_calldata_used" DECIMAL(100,0) NOT NULL;

-- AlterTable
ALTER TABLE "transaction" DROP COLUMN "blob_as_calldata_gas_used",
ADD COLUMN     "blob_gas_as_calldata_used" DECIMAL(100,0) NOT NULL;
