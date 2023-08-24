-- CreateEnum
CREATE TYPE "BlobStorage" AS ENUM ('google', 'postgres', 'swarm');

-- CreateTable
CREATE TABLE "BlockchainSyncState" (
    "id" SERIAL NOT NULL,
    "lastFinalizedBlock" INTEGER NOT NULL,
    "lastSlot" INTEGER NOT NULL,

    CONSTRAINT "BlockchainSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "address" TEXT NOT NULL,
    "firstBlockNumberAsSender" INTEGER,
    "firstBlockNumberAsReceiver" INTEGER,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "Blob" (
    "versionedHash" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "firstBlockNumber" INTEGER,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blob_pkey" PRIMARY KEY ("versionedHash")
);

-- CreateTable
CREATE TABLE "BlobData" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "BlobData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobDataStorageReference" (
    "blobHash" TEXT NOT NULL,
    "blobStorage" "BlobStorage" NOT NULL,
    "dataReference" TEXT NOT NULL,

    CONSTRAINT "BlobDataStorageReference_pkey" PRIMARY KEY ("blobHash","blobStorage")
);

-- CreateTable
CREATE TABLE "Block" (
    "hash" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "slot" INTEGER NOT NULL,
    "blobGasUsed" BIGINT NOT NULL,
    "excessBlobGas" BIGINT NOT NULL,
    "blobAsCalldataGasUsed" BIGINT NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "maxFeePerBlobGas" BIGINT NOT NULL,
    "blobGasPrice" BIGINT NOT NULL,
    "gasPrice" BIGINT NOT NULL,
    "blobAsCalldataGasUsed" BIGINT NOT NULL,
    "insertedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "BlobsOnTransactions" (
    "blobHash" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "BlobsOnTransactions_pkey" PRIMARY KEY ("txHash","index")
);

-- CreateTable
CREATE TABLE "BlockOverallStats" (
    "id" SERIAL NOT NULL,
    "totalBlocks" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockDailyStats" (
    "day" DATE NOT NULL,
    "totalBlocks" INTEGER NOT NULL,

    CONSTRAINT "BlockDailyStats_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "TransactionOverallStats" (
    "id" SERIAL NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalUniqueReceivers" INTEGER NOT NULL,
    "totalUniqueSenders" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionDailyStats" (
    "day" DATE NOT NULL,
    "totalTransactions" INTEGER NOT NULL,
    "totalUniqueSenders" INTEGER NOT NULL,
    "totalUniqueReceivers" INTEGER NOT NULL,

    CONSTRAINT "TransactionDailyStats_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "BlobOverallStats" (
    "id" SERIAL NOT NULL,
    "totalBlobs" INTEGER NOT NULL,
    "totalUniqueBlobs" INTEGER NOT NULL,
    "totalBlobSize" BIGINT NOT NULL,
    "avgBlobSize" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlobOverallStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlobDailyStats" (
    "day" DATE NOT NULL,
    "totalBlobs" INTEGER NOT NULL,
    "totalUniqueBlobs" INTEGER NOT NULL,
    "totalBlobSize" BIGINT NOT NULL,
    "avgBlobSize" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BlobDailyStats_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE INDEX "Address_insertedAt_idx" ON "Address"("insertedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_commitment_key" ON "Blob"("commitment");

-- CreateIndex
CREATE INDEX "Blob_insertedAt_idx" ON "Blob"("insertedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Block_number_key" ON "Block"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Block_timestamp_key" ON "Block"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Block_slot_key" ON "Block"("slot");

-- CreateIndex
CREATE INDEX "Block_insertedAt_idx" ON "Block"("insertedAt");

-- CreateIndex
CREATE INDEX "Transaction_insertedAt_idx" ON "Transaction"("insertedAt");

-- CreateIndex
CREATE INDEX "Transaction_blockNumber_idx" ON "Transaction"("blockNumber");

-- CreateIndex
CREATE INDEX "BlobsOnTransactions_blobHash_idx" ON "BlobsOnTransactions"("blobHash");

-- CreateIndex
CREATE INDEX "BlobsOnTransactions_txHash_idx" ON "BlobsOnTransactions"("txHash");

-- CreateIndex
CREATE INDEX "BlockDailyStats_day_idx" ON "BlockDailyStats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "BlockDailyStats_day_key" ON "BlockDailyStats"("day");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_firstBlockNumberAsSender_fkey" FOREIGN KEY ("firstBlockNumberAsSender") REFERENCES "Block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_firstBlockNumberAsReceiver_fkey" FOREIGN KEY ("firstBlockNumberAsReceiver") REFERENCES "Block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blob" ADD CONSTRAINT "Blob_firstBlockNumber_fkey" FOREIGN KEY ("firstBlockNumber") REFERENCES "Block"("number") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobDataStorageReference" ADD CONSTRAINT "BlobDataStorageReference_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block"("number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_blobHash_fkey" FOREIGN KEY ("blobHash") REFERENCES "Blob"("versionedHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlobsOnTransactions" ADD CONSTRAINT "BlobsOnTransactions_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

