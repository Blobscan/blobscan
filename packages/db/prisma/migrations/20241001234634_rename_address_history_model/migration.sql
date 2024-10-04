-- RenameTable
ALTER TABLE "address_history" RENAME TO "address_category_info";

-- RenameConstraints
ALTER TABLE "address_category_info" RENAME CONSTRAINT "address_history_pkey" TO "address_category_info_pkey";
ALTER TABLE "address_category_info" RENAME CONSTRAINT "address_history_address_fkey" TO "address_category_info_address_fkey";
