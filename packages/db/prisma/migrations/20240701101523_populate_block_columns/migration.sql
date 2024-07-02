UPDATE "transaction" 
SET 
  block_number = (
    SELECT "number" as block_number 
    FROM "block" 
    WHERE block.hash = transaction.block_hash
  ),
  block_timestamp = (
    SELECT "timestamp" as block_timestamp
    FROM "block" 
    WHERE block.hash = transaction.block_hash
  );
