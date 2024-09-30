/*
  Warnings:

  - The primary key for the `transaction_fork` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "transaction_fork" DROP CONSTRAINT "transaction_fork_pkey",
ADD CONSTRAINT "transaction_fork_pkey" PRIMARY KEY ("block_hash", "hash");
