-- AlterTable
ALTER TABLE "blockchain_sync_state" ADD COLUMN     "last_upper_synced_block_root" TEXT,
ADD COLUMN     "last_upper_synced_block_slot" INTEGER;
