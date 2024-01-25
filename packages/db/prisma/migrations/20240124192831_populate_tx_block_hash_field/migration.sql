-- PopulateBlockHashFields.

UPDATE "transaction" SET block_hash = (SELECT "hash" FROM "block" as b WHERE b."number" = "transaction"."block_number" LIMIT 1);