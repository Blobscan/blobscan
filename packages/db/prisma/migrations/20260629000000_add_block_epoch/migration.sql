-- AlterTable
-- `epoch` is nullable for now. Existing rows will be backfilled in a follow-up
-- PR, which will also create the `block_epoch_idx` index (CONCURRENTLY, since
-- it's useless until the column is populated) and make the column NOT NULL.
ALTER TABLE "block" ADD COLUMN "epoch" INTEGER;
