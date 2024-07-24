UPDATE blobs_on_transactions 
SET 
  block_hash = (
    SELECT block_hash 
    FROM "transaction"
    WHERE transaction.hash = blobs_on_transactions.tx_hash
  ),
  block_number = (
    SELECT block_number 
    FROM "transaction" 
    WHERE transaction.hash = blobs_on_transactions.tx_hash
  ),
  block_timestamp = (
    SELECT block_timestamp
    FROM "transaction" 
    WHERE "transaction".hash = blobs_on_transactions.tx_hash
  );
