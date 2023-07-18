/*
  Warnings:

  - You are about to drop the `IndexerMetadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "IndexerMetadata";

-- CreateTable
CREATE TABLE "BlockchainSyncState" (
    "id" SERIAL NOT NULL,
    "lastSlot" INTEGER NOT NULL,

    CONSTRAINT "BlockchainSyncState_pkey" PRIMARY KEY ("id")
);
