-- PopulateBlockBlobGasPrice.

UPDATE "block" SET blob_gas_price = (SELECT blob_gas_price FROM "transaction" WHERE "transaction".block_number = "block"."number" LIMIT 1);
