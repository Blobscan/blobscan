-- CreateTable
CREATE TABLE "transaction_fork" (
    "hash" TEXT NOT NULL,
    "block_hash" TEXT NOT NULL,
    "inserted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_fork_pkey" PRIMARY KEY ("hash","block_hash")
);

-- AddForeignKey
ALTER TABLE "transaction_fork" ADD CONSTRAINT "transaction_fork_block_hash_fkey" FOREIGN KEY ("block_hash") REFERENCES "block"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_fork" ADD CONSTRAINT "transaction_fork_hash_fkey" FOREIGN KEY ("hash") REFERENCES "transaction"("hash") ON DELETE RESTRICT ON UPDATE CASCADE;
