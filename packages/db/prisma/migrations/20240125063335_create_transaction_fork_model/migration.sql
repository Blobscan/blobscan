-- CreateTable
CREATE TABLE "TransactionFork" (
    "hash" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "block_hash" TEXT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionFork_pkey" PRIMARY KEY ("hash","block_hash")
);

-- AddForeignKey
ALTER TABLE "TransactionFork" ADD CONSTRAINT "TransactionFork_block_hash_fkey" FOREIGN KEY ("block_hash") REFERENCES "block"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionFork" ADD CONSTRAINT "TransactionFork_hash_fkey" FOREIGN KEY ("hash") REFERENCES "transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
