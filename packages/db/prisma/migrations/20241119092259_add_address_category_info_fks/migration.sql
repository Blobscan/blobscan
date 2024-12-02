-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_from_id_category_fkey" FOREIGN KEY ("from_id", "category") REFERENCES "address_category_info"("address", "category") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_to_id_category_fkey" FOREIGN KEY ("to_id", "category") REFERENCES "address_category_info"("address", "category") ON DELETE RESTRICT ON UPDATE CASCADE;
