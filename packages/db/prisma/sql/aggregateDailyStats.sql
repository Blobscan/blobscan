-- @param {DateTime} $1:from The date from which to start aggregating the data.
-- @param {DateTime} $2:to The date until which to aggregate the data.
WITH tx_blob_aggregates AS (
    SELECT
      btx.tx_hash,
      COUNT(btx.blob_hash) AS total_blobs,
      COUNT(
        DISTINCT CASE
          WHEN b.first_block_number = btx.block_number THEN btx.blob_hash
        END
      ) AS total_unique_blobs,
      SUM(b.size) AS total_blob_size
    FROM blobs_on_transactions btx
    JOIN blob b ON b.versioned_hash = btx.blob_hash
    WHERE btx.block_timestamp BETWEEN $1 AND $2
    GROUP BY btx.tx_hash
)
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
  avg_blob_gas_price,
  total_blobs,
  total_unique_blobs,
  total_blob_size
)
SELECT
  DATE_TRUNC('day', tx.block_timestamp) AS day,
  tx.category,
  tx.rollup,
  COALESCE(COUNT(DISTINCT tx.block_number)::INT, 0) AS total_blocks,
  COALESCE(COUNT(tx.hash)::INT, 0) AS total_transactions,
  COALESCE(
    COUNT(
      DISTINCT CASE
        WHEN a_to.first_block_number_as_receiver = tx.block_number THEN a_to.address END
    )::INT,
    0
  ) AS total_unique_receivers,
  COALESCE(
    COUNT(
      DISTINCT CASE
        WHEN a_from.first_block_number_as_sender = tx.block_number THEN a_from.address END
    )::INT,
    0
  ) AS total_unique_senders,
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
  COALESCE(AVG(b.blob_gas_price)::FLOAT, 0) AS avg_blob_gas_price,
  COALESCE(SUM(blob_agg.total_blobs), 0) AS total_blobs,
  COALESCE(SUM(blob_agg.total_unique_blobs), 0) AS total_unique_blobs,
  COALESCE(SUM(blob_agg.total_blob_size), 0) AS total_blob_size
FROM transaction tx
  JOIN block b ON b.hash = tx.block_hash
  JOIN address_category_info a_from ON a_from.address = tx.from_id AND a_from.category = tx.category
  JOIN address_category_info a_to ON a_to.address = tx.to_id AND a_to.category = tx.category
  LEFT JOIN transaction_fork tx_f ON tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
  LEFT JOIN tx_blob_aggregates blob_agg ON blob_agg.tx_hash = tx.hash
WHERE tx_f.hash IS NULL AND tx.block_timestamp BETWEEN $1 AND $2
GROUP BY GROUPING SETS (
  (day, tx.category),
  (day, tx.rollup),
  (day)
)
--  Exclude NULL rollup aggregates from the second grouping set, as they’re already included in the first when the category is OTHER
HAVING NOT (
  GROUPING(tx.rollup) = 0 AND
  tx.rollup IS NULL
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
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,
  total_blobs = EXCLUDED.total_blobs,
  total_unique_blobs = EXCLUDED.total_unique_blobs,
  total_blob_size = EXCLUDED.total_blob_size
