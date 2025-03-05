-- @param {Int} $1:from The block number from which to start aggregating the data.
-- @param {Int} $2:to The block number until which to aggregate the data.
INSERT INTO overall_stats AS curr_stats (
  category,
  rollup,
  total_blocks,
  total_transactions,
  total_unique_receivers,
  total_unique_senders,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_fee,
  total_blob_max_fees,
  total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fees,
  total_blob_max_gas_fees,
  total_blob_gas_price,
  avg_blob_fee,
  avg_blob_max_fee,
  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee,
  avg_blob_gas_price,
  updated_at
)
SELECT
  CASE WHEN from_addr.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
  from_addr.rollup,
  COALESCE(COUNT(DISTINCT tx.block_number)::INT, 0) AS total_blocks,
  COALESCE(COUNT(tx.hash)::INT, 0) AS total_transactions,
  COALESCE(
    COUNT(
      DISTINCT CASE
        WHEN to_addr.first_block_number_as_receiver BETWEEN $1 AND $2 THEN to_addr.address END
    )::INT,
    0
  ) AS total_unique_receivers,
  COALESCE(
    COUNT(
      DISTINCT CASE
        WHEN from_addr.first_block_number_as_sender BETWEEN $1 AND $2 THEN from_addr.address END
    )::INT,
    0
  ) AS total_unique_senders,
  COALESCE(SUM(tx.blob_gas_used)::DECIMAL, 0) AS total_blob_gas_used,
  COALESCE(SUM(tx.blob_as_calldata_gas_used)::DECIMAL, 0) AS total_blob_as_calldata_gas_used,
  COALESCE(SUM(tx.blob_gas_used * b.blob_gas_price)::DECIMAL, 0) AS total_blob_fee,
  COALESCE(SUM(tx.blob_gas_used * tx.max_fee_per_blob_gas)::DECIMAL, 0) AS total_blob_max_fees,
  COALESCE(SUM(tx.blob_as_calldata_gas_used * b.blob_gas_price)::DECIMAL, 0) AS total_blob_as_calldata_fee,
  COALESCE(SUM(tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas)::DECIMAL, 0) AS total_blob_as_calldata_max_fees,
  COALESCE(SUM(tx.max_fee_per_blob_gas)::DECIMAL, 0) AS total_blob_max_gas_fees,
  COALESCE(SUM(b.blob_gas_price)::DECIMAL, 0) AS total_blob_gas_price,
  COALESCE(AVG(tx.blob_gas_used * b.blob_gas_price)::FLOAT, 0) AS avg_blob_fee,
  COALESCE(AVG(tx.blob_gas_used * tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_blob_max_fee,
  COALESCE(AVG(tx.blob_as_calldata_gas_used * b.blob_gas_price)::FLOAT, 0) AS avg_blob_as_calldata_fee,
  COALESCE(AVG(tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_blob_as_calldata_max_fee,
  COALESCE(AVG(tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_max_blob_gas_fee,
  COALESCE(AVG(b.blob_gas_price)::FLOAT, 0) AS avg_blob_gas_price,
  NOW() AS updated_at
FROM transaction tx
  JOIN block b ON b.hash = tx.block_hash
  JOIN address from_addr ON from_addr.address = tx.from_id
  JOIN address to_addr ON to_addr.address = tx.to_id
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = b.hash AND tx_f.hash = tx.hash
WHERE tx_f.hash IS NULL AND b.number BETWEEN $1 AND $2
GROUP BY GROUPING SETS (
  (category),
  (from_addr.rollup),
  ()
)
--  Exclude NULL rollup aggregates from the second grouping set, as they’re already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(from_addr.rollup) = 0 AND
  from_addr.rollup IS NULL
)
ON CONFLICT (category, rollup) DO UPDATE SET
  total_blocks = curr_stats.total_blocks + EXCLUDED.total_blocks,
  total_transactions = curr_stats.total_transactions + EXCLUDED.total_transactions,
  total_unique_receivers = curr_stats.total_unique_receivers + EXCLUDED.total_unique_receivers,
  total_unique_senders = curr_stats.total_unique_senders + EXCLUDED.total_unique_senders,
  total_blob_gas_used = curr_stats.total_blob_gas_used + EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = curr_stats.total_blob_as_calldata_gas_used + EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_fee = curr_stats.total_blob_fee + EXCLUDED.total_blob_fee,
  total_blob_max_fees = curr_stats.total_blob_max_fees + EXCLUDED.total_blob_max_fees,
  total_blob_as_calldata_fee = curr_stats.total_blob_as_calldata_fee + EXCLUDED.total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fees = curr_stats.total_blob_as_calldata_max_fees + EXCLUDED.total_blob_as_calldata_max_fees,
  total_blob_max_gas_fees = curr_stats.total_blob_max_gas_fees + EXCLUDED.total_blob_max_gas_fees,
  total_blob_gas_price = curr_stats.total_blob_gas_price + EXCLUDED.total_blob_gas_price,
  avg_blob_fee =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_fee + EXCLUDED.total_blob_fee) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  avg_blob_max_fee =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_max_fees + EXCLUDED.total_blob_max_fees) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  avg_blob_as_calldata_fee =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_as_calldata_fee + EXCLUDED.total_blob_as_calldata_fee) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  avg_blob_as_calldata_max_fee =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_as_calldata_max_fees + EXCLUDED.total_blob_as_calldata_max_fees) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  avg_max_blob_gas_fee =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_max_gas_fees + EXCLUDED.total_blob_max_gas_fees) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  avg_blob_gas_price =
    CASE
      WHEN curr_stats.total_transactions + EXCLUDED.total_transactions = 0 THEN 0
      ELSE (curr_stats.total_blob_gas_price + EXCLUDED.total_blob_gas_price) / (curr_stats.total_transactions + EXCLUDED.total_transactions)
    END,
  updated_at = EXCLUDED.updated_at