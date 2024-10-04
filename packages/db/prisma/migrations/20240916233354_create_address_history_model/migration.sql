-- CreateTable
CREATE TABLE "address_history" (
    "address" TEXT NOT NULL,
    "category" "category" NOT NULL DEFAULT 'other',
    "first_block_number_as_sender" INTEGER,
    "first_block_number_as_receiver" INTEGER,

    CONSTRAINT "address_history_pkey" PRIMARY KEY ("address","category")
);

-- AddForeignKey
ALTER TABLE "address_history" ADD CONSTRAINT "address_history_address_fkey" FOREIGN KEY ("address") REFERENCES "address"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
