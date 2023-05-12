-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "lastSlot" INTEGER NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blob" (
    "id" SERIAL NOT NULL,
    "versionedHash" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    CONSTRAINT "Blob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_lastSlot_key" ON "Config"("lastSlot");

-- CreateIndex
CREATE UNIQUE INDEX "Blob_txHash_index_key" ON "Blob"("txHash", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Block_number_key" ON "Block"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Block_timestamp_key" ON "Block"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Block_slot_key" ON "Block"("slot");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_hash_key" ON "Transaction"("hash");

-- AddForeignKey
ALTER TABLE "Blob" ADD CONSTRAINT "Blob_txHash_fkey" FOREIGN KEY ("txHash") REFERENCES "Transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_blockNumber_fkey" FOREIGN KEY ("blockNumber") REFERENCES "Block"("number") ON DELETE RESTRICT ON UPDATE CASCADE;
