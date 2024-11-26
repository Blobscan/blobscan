-- CreateIndex
CREATE INDEX "address_category_info_first_block_number_as_receiver_idx" ON "address_category_info"("first_block_number_as_receiver");

-- CreateIndex
CREATE INDEX "address_category_info_first_block_number_as_sender_idx" ON "address_category_info"("first_block_number_as_sender");

-- CreateIndex
CREATE INDEX "blob_first_block_number_idx" ON "blob"("first_block_number");
