/*
  Warnings:

  - You are about to drop the column `first_block_number_as_receiver` on the `address` table. All the data in the column will be lost.
  - You are about to drop the column `first_block_number_as_sender` on the `address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "address" DROP COLUMN "first_block_number_as_receiver",
DROP COLUMN "first_block_number_as_sender";
