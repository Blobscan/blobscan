-- DropIndex: strict prefix of "transaction_from_id_block_timestamp_index_idx"
DROP INDEX IF EXISTS "transaction_from_id_block_timestamp_idx";

-- DropIndex: strict prefix of both the primary key (tx_hash, index) and "blobs_on_transactions_tx_hash_blob_hash_idx"
DROP INDEX IF EXISTS "blobs_on_transactions_tx_hash_idx";

-- DropIndex: leads with the primary key column; rollup-only filters use "address_rollup_idx"
DROP INDEX IF EXISTS "address_address_rollup_idx";
