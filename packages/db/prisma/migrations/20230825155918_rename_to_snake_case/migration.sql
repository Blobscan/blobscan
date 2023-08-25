-- CreateEnum
CREATE TYPE "blob_storage" AS ENUM ('google', 'postgres', 'swarm');

-- CreateTable
CREATE TABLE "blockchain_sync_state" (
    "id" SERIAL NOT NULL,
    "last_finalized_block" INTEGER NOT NULL,
    "last_slot" INTEGER NOT NULL,

    CONSTRAINT "blockchain_sync_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "address" (
    "address" TEXT NOT NULL,
    "first_block_number_as_sender" INTEGER,
    "first_block_number_as_receiver" INTEGER,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "address_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "blob" (
    "versioned_hash" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "first_block_number" INTEGER,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blob_pkey" PRIMARY KEY ("versioned_hash")
);

-- CreateTable
CREATE TABLE "blob_data" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "blob_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blob_data_storage_reference" (
    "blob_hash" TEXT NOT NULL,
    "storage" "blob_storage" NOT NULL,
    "data_reference" TEXT NOT NULL,

    CONSTRAINT "blob_data_storage_reference_pkey" PRIMARY KEY ("blob_hash","storage")
);

-- CreateTable
CREATE TABLE "block" (
    "hash" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL,
    "blob_gas_used" BIGINT NOT NULL,
    "excess_blob_gas" BIGINT NOT NULL,
    "blob_as_calldata_gas_used" BIGINT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "transaction" (
    "hash" TEXT NOT NULL,
    "from_id" TEXT NOT NULL,
    "to_id" TEXT NOT NULL,
    "block_number" INTEGER NOT NULL,
    "max_fee_per_blob_gas" BIGINT NOT NULL,
    "blob_gas_price" BIGINT NOT NULL,
    "gas_price" BIGINT NOT NULL,
    "blob_as_calldata_gas_used" BIGINT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "blobs_on_transactions" (
    "blob_hash" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "blobs_on_transactions_pkey" PRIMARY KEY ("tx_hash","index")
);

-- CreateTable
CREATE TABLE "block_overall_stats" (
    "id" SERIAL NOT NULL,
    "total_blocks" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_overall_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_daily_stats" (
    "day" DATE NOT NULL,
    "total_blocks" INTEGER NOT NULL,

    CONSTRAINT "block_daily_stats_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "transaction_overall_stats" (
    "id" SERIAL NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_overall_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_daily_stats" (
    "day" DATE NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "total_unique_senders" INTEGER NOT NULL,
    "total_unique_receivers" INTEGER NOT NULL,

    CONSTRAINT "transaction_daily_stats_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "blob_overall_stats" (
    "id" SERIAL NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "avg_blob_size" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blob_overall_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blob_daily_stats" (
    "day" DATE NOT NULL,
    "total_blobs" INTEGER NOT NULL,
    "total_unique_blobs" INTEGER NOT NULL,
    "total_blob_size" BIGINT NOT NULL,
    "avg_blob_size" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "blob_daily_stats_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE INDEX "address_inserted_at_idx" ON "address"("inserted_at");

-- CreateIndex
CREATE UNIQUE INDEX "blob_commitment_key" ON "blob"("commitment");

-- CreateIndex
CREATE INDEX "blob_inserted_at_idx" ON "blob"("inserted_at");

-- CreateIndex
CREATE UNIQUE INDEX "block_number_key" ON "block"("number");

-- CreateIndex
CREATE UNIQUE INDEX "block_timestamp_key" ON "block"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "block_slot_key" ON "block"("slot");

-- CreateIndex
CREATE INDEX "block_inserted_at_idx" ON "block"("inserted_at");

-- CreateIndex
CREATE INDEX "transaction_inserted_at_idx" ON "transaction"("inserted_at");

-- CreateIndex
CREATE INDEX "transaction_block_number_idx" ON "transaction"("block_number");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_blob_hash_idx" ON "blobs_on_transactions"("blob_hash");

-- CreateIndex
CREATE INDEX "blobs_on_transactions_tx_hash_idx" ON "blobs_on_transactions"("tx_hash");

-- CreateIndex
CREATE INDEX "block_daily_stats_day_idx" ON "block_daily_stats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "block_daily_stats_day_key" ON "block_daily_stats"("day");

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_first_block_number_as_sender_fkey" FOREIGN KEY ("first_block_number_as_sender") REFERENCES "block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_first_block_number_as_receiver_fkey" FOREIGN KEY ("first_block_number_as_receiver") REFERENCES "block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blob" ADD CONSTRAINT "blob_first_block_number_fkey" FOREIGN KEY ("first_block_number") REFERENCES "block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blob_data_storage_reference" ADD CONSTRAINT "blob_data_storage_reference_blob_hash_fkey" FOREIGN KEY ("blob_hash") REFERENCES "blob"("versioned_hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_block_number_fkey" FOREIGN KEY ("block_number") REFERENCES "block"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blobs_on_transactions" ADD CONSTRAINT "blobs_on_transactions_blob_hash_fkey" FOREIGN KEY ("blob_hash") REFERENCES "blob"("versioned_hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blobs_on_transactions" ADD CONSTRAINT "blobs_on_transactions_tx_hash_fkey" FOREIGN KEY ("tx_hash") REFERENCES "transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;


-- MigrateData

INSERT INTO "blockchain_sync_state" ("last_finalized_block", "last_slot") SELECT "lastFinalizedBlock" AS "last_finalized_block", "lastSlot" AS "last_slot" FROM "BlockchainSyncState";

INSERT INTO "block" ("hash", "number", "timestamp", "slot", "blob_gas_used", "excess_blob_gas", "blob_as_calldata_gas_used", "inserted_at", "updated_at") SELECT "hash" AS "hash", "number" AS "number", "timestamp" AS "timestamp", "slot" AS "slot", "blobGasUsed" AS "blob_gas_used", "excessBlobGas" AS "excess_blob_gas", "blobAsCalldataGasUsed" AS "blob_as_calldata_gas_used", "insertedAt" AS "inserted_at", "updatedAt" AS "updated_at" FROM "Block";

INSERT INTO "address" ("address", "first_block_number_as_sender", "first_block_number_as_receiver", "inserted_at", "updated_at") SELECT "address" AS "address", "firstBlockNumberAsSender" AS "first_block_number_as_sender", "firstBlockNumberAsReceiver" AS "first_block_number_as_receiver", "insertedAt" AS "inserted_at", "updatedAt" AS "updated_at" FROM "Address";

INSERT INTO "transaction" ("hash", "from_id", "to_id", "block_number", "max_fee_per_blob_gas", "blob_gas_price", "gas_price", "blob_as_calldata_gas_used", "inserted_at", "updated_at") SELECT "hash" AS "hash", "fromId" AS "from_id", "toId" AS "to_id", "blockNumber" AS "block_number", "maxFeePerBlobGas" AS "max_fee_per_blob_gas", "blobGasPrice" AS "blob_gas_price", "gasPrice" AS "gas_price", "blobAsCalldataGasUsed" AS "blob_as_calldata_gas_used", "insertedAt" AS "inserted_at", "updatedAt" AS "updated_at" FROM "Transaction";

INSERT INTO "blob" ("versioned_hash", "commitment", "size", "first_block_number", "inserted_at", "updated_at") SELECT "versionedHash" AS "versioned_hash", "commitment" AS "commitment", "size" AS "size", "firstBlockNumber" AS "first_block_number", "insertedAt" AS "inserted_at", "updatedAt" AS "updated_at" FROM "Blob";

INSERT INTO "blob_data" ("id", "data") SELECT "id" AS "id", "data" AS "data" FROM "BlobData";

INSERT INTO "blob_data_storage_reference" ("blob_hash", "storage", "data_reference")
    SELECT
        "blobHash" AS "blob_hash",
        (
            CASE 
                WHEN "blobStorage" = 'google'::"BlobStorage" THEN 'google'::"blob_storage"
                WHEN "blobStorage" = 'postgres'::"BlobStorage" THEN 'postgres'::"blob_storage"
                ELSE 'swarm'::"blob_storage"
            END
        )::"blob_storage" AS "storage",
        "dataReference" AS "data_reference"

    FROM "BlobDataStorageReference";

INSERT INTO "blobs_on_transactions" ("blob_hash", "tx_hash", "index")
    SELECT "blobHash" AS "blob_hash", "txHash" AS "tx_hash", "index" AS "index" FROM "BlobsOnTransactions";

INSERT INTO "block_overall_stats" ("total_blocks", "updated_at")
    SELECT "totalBlocks" AS "total_blocks", "updatedAt" AS "updated_at" FROM "BlockOverallStats";

INSERT INTO "block_daily_stats" ("day", "total_blocks")
    SELECT "day" AS "day", "totalBlocks" AS "total_blocks" FROM "BlockDailyStats";

INSERT INTO "transaction_overall_stats" ("total_transactions", "total_unique_receivers", "total_unique_senders", "updated_at")
    SELECT "totalTransactions" AS "total_transactions", "totalUniqueReceivers" AS "total_unique_receivers", "totalUniqueSenders" AS "total_unique_senders", "updatedAt" AS "updated_at" FROM "TransactionOverallStats";

INSERT INTO "transaction_daily_stats" ("day", "total_transactions", "total_unique_senders", "total_unique_receivers")
    SELECT "day" AS "day", "totalTransactions" AS "total_transactions", "totalUniqueSenders" AS "total_unique_senders", "totalUniqueReceivers" AS "total_unique_receivers" FROM "TransactionDailyStats";

INSERT INTO "blob_overall_stats" ("total_blobs", "total_unique_blobs", "total_blob_size", "avg_blob_size", "updated_at")
    SELECT "totalBlobs" AS "total_blobs", "totalUniqueBlobs" AS "total_unique_blobs", "totalBlobSize" AS "total_blob_size", "avgBlobSize" AS "avg_blob_size", "updatedAt" AS "updated_at" FROM "BlobOverallStats";

INSERT INTO "blob_daily_stats" ("day", "total_blobs", "total_unique_blobs", "total_blob_size", "avg_blob_size")
    SELECT "day" AS "day", "totalBlobs" AS "total_blobs", "totalUniqueBlobs" AS "total_unique_blobs", "totalBlobSize" AS "total_blob_size", "avgBlobSize" AS "avg_blob_size" FROM "BlobDailyStats";

/*
  Warnings:

  - You are about to drop the `Address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Blob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlobDailyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlobData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlobDataStorageReference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlobOverallStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlobsOnTransactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlockDailyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlockOverallStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlockchainSyncState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionDailyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionOverallStats` table. If the table is not empty, all the data it contains will be lost.

*/

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_firstBlockNumberAsReceiver_fkey";

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_firstBlockNumberAsSender_fkey";

-- DropForeignKey
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_firstBlockNumber_fkey";

-- DropForeignKey
ALTER TABLE "BlobDataStorageReference" DROP CONSTRAINT "BlobDataStorageReference_blobHash_fkey";

-- DropForeignKey
ALTER TABLE "BlobsOnTransactions" DROP CONSTRAINT "BlobsOnTransactions_blobHash_fkey";

-- DropForeignKey
ALTER TABLE "BlobsOnTransactions" DROP CONSTRAINT "BlobsOnTransactions_txHash_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_blockNumber_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_toId_fkey";

-- DropTable
DROP TABLE "Address";

-- DropTable
DROP TABLE "Blob";

-- DropTable
DROP TABLE "BlobDailyStats";

-- DropTable
DROP TABLE "BlobData";

-- DropTable
DROP TABLE "BlobDataStorageReference";

-- DropTable
DROP TABLE "BlobOverallStats";

-- DropTable
DROP TABLE "BlobsOnTransactions";

-- DropTable
DROP TABLE "Block";

-- DropTable
DROP TABLE "BlockDailyStats";

-- DropTable
DROP TABLE "BlockOverallStats";

-- DropTable
DROP TABLE "BlockchainSyncState";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "TransactionDailyStats";

-- DropTable
DROP TABLE "TransactionOverallStats";

-- DropEnum
DROP TYPE "BlobStorage";