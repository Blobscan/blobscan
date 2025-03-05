-- @param {DateTime} $1:from The date from which to start aggregating the data.
-- @param {DateTime} $2:to The date until which to aggregate the data.
INSERT INTO daily_stats (
  day,
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
  avg_blob_fee,
  avg_blob_max_fee,
  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee,
  avg_blob_gas_price
)
SELECT
  DATE_TRUNC('day', tx.block_timestamp) AS day,
  CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
  f.rollup,
  COALESCE(COUNT(DISTINCT tx.block_number)::INT, 0) AS total_blocks,
  COALESCE(COUNT(tx.hash)::INT, 0) AS total_transactions,
  COALESCE(COUNT(DISTINCT tx.to_id)::INT, 0) AS total_unique_receivers,
  COALESCE(COUNT(DISTINCT tx.from_id)::INT, 0) AS total_unique_senders,
  COALESCE(SUM(tx.blob_gas_used)::DECIMAL, 0) AS total_blob_gas_used,
  COALESCE(SUM(tx.blob_as_calldata_gas_used)::DECIMAL, 0) AS total_blob_as_calldata_gas_used,
  COALESCE(SUM(tx.blob_gas_used * b.blob_gas_price)::DECIMAL, 0) AS total_blob_fee,
  COALESCE(SUM(tx.blob_gas_used * tx.max_fee_per_blob_gas)::DECIMAL, 0) AS total_blob_max_fees,
  COALESCE(SUM(tx.blob_as_calldata_gas_used * b.blob_gas_price)::DECIMAL, 0) AS total_blob_as_calldata_fee,
  COALESCE(SUM(tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas)::DECIMAL, 0) AS total_blob_as_calldata_max_fees,
  COALESCE(AVG(tx.blob_gas_used * b.blob_gas_price)::FLOAT , 0) AS avg_blob_fee,
  COALESCE(AVG(tx.blob_gas_used * tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_blob_max_fee,
  COALESCE(AVG(tx.blob_as_calldata_gas_used * b.blob_gas_price)::FLOAT, 0) AS avg_blob_as_calldata_fee,
  COALESCE(AVG(tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_blob_as_calldata_max_fee,
  COALESCE(AVG(tx.max_fee_per_blob_gas)::FLOAT, 0) AS avg_max_blob_gas_fee,
  COALESCE(AVG(b.blob_gas_price)::FLOAT, 0) AS avg_blob_gas_price
FROM transaction tx
  JOIN block b ON b.hash = tx.block_hash
  JOIN address f ON f.address = tx.from_id
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
WHERE tx_f.hash IS NULL AND tx.block_timestamp BETWEEN $1 AND $2
GROUP BY GROUPING SETS (
  (day, category),
  (day, f.rollup),
  (day)
)
--  Exclude NULL rollup aggregates from the second grouping set, as they’re already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(f.rollup) = 0 AND
  f.rollup IS NULL
)
ON CONFLICT (day, category, rollup) DO UPDATE SET
  total_blocks = EXCLUDED.total_blocks,
  total_transactions = EXCLUDED.total_transactions,
  total_unique_receivers = EXCLUDED.total_unique_receivers,
  total_unique_senders = EXCLUDED.total_unique_senders,
  total_blob_gas_used = EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_fee = EXCLUDED.total_blob_fee,
  total_blob_max_fees = EXCLUDED.total_blob_max_fees,
  total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fees = EXCLUDED.total_blob_as_calldata_max_fees,
  avg_blob_fee = EXCLUDED.avg_blob_fee,
  avg_blob_max_fee = EXCLUDED.avg_blob_max_fee,
  avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee = EXCLUDED.avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee = EXCLUDED.avg_max_blob_gas_fee,
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price
