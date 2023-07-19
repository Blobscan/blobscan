/*
  Warnings:

  - Added the required column `lastFinalizedBlock` to the `BlockchainSyncState` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BlockchainSyncState" ADD COLUMN     "lastFinalizedBlock" INTEGER NOT NULL;
