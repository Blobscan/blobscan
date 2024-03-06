/*
  Warnings:

  - You are about to drop the column `last_slot` on the `blockchain_sync_state` table. All the data in the column will be lost.

*/
 
-- AlterTable
ALTER TABLE "blockchain_sync_state" ADD COLUMN "last_lower_synced_slot" INTEGER,
ADD COLUMN     "last_upper_synced_slot" INTEGER;

UPDATE "blockchain_sync_state"
SET "last_lower_synced_slot" = 0,
    "last_upper_synced_slot" = "last_slot" WHERE id = 1;

ALTER TABLE "blockchain_sync_state" DROP COLUMN "last_slot";