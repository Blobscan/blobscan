WITH base AS (
  SELECT
    DATE_TRUNC('hour', tx.block_timestamp) AS period_start,
    CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
    f.rollup,
    tx.block_number,
    tx.hash,
    tx.to_id,
    tx.from_id,
    b.blob_gas_price,
    tx.blob_gas_used,
    tx.blob_as_calldata_gas_used,
    tx.max_fee_per_blob_gas,
    (tx.blob_gas_used * b.blob_gas_price)                    AS blob_base_fee,
    (tx.blob_gas_used * tx.max_fee_per_blob_gas)             AS blob_max_fee,
    (tx.blob_as_calldata_gas_used * b.blob_gas_price)        AS blob_as_calldata_fee,
    (tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas) AS blob_as_calldata_max_fee
  FROM transaction tx
    JOIN block b ON b.hash = tx.block_hash
    JOIN address f ON f.address = tx.from_id
  WHERE tx.block_timestamp >= :from AND tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
)
INSERT INTO hourly_metrics (
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  avg_blob_base_fee,
  avg_blob_gas_price,

  total_blob_gas_price,
  total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  avg_blob_max_fee,
  avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee,

  total_transactions,
  total_unique_receivers,
  total_unique_senders,
  total_blob_gas_used,
  total_blob_as_calldata_gas_used,
  total_blob_base_fee,
  total_blob_max_fee,
  total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fee,
  total_max_blob_gas_fee
)
SELECT
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  -- Only computed for the global grouping set (period_start)
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(AVG(blob_base_fee)::FLOAT, 0)
  END AS avg_blob_base_fee,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(AVG(blob_gas_price)::FLOAT, 0)
  END AS avg_blob_gas_price,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(SUM(blob_gas_price)::DECIMAL, 0)
  END AS total_blob_gas_price,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COUNT(DISTINCT block_number)::INT
  END AS total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  COALESCE(AVG(blob_max_fee)::FLOAT, 0) AS avg_blob_max_fee,
  COALESCE(AVG(blob_as_calldata_fee)::FLOAT, 0) AS avg_blob_as_calldata_fee,
  COALESCE(AVG(blob_as_calldata_max_fee)::FLOAT, 0) AS avg_blob_as_calldata_max_fee,
  COALESCE(AVG(max_fee_per_blob_gas)::FLOAT, 0) AS avg_max_blob_gas_fee,

  COUNT(hash)::INT AS total_transactions,
  COUNT(DISTINCT to_id)::INT AS total_unique_receivers,
  COUNT(DISTINCT from_id)::INT AS total_unique_senders,
  COALESCE(SUM(blob_gas_used)::DECIMAL, 0) AS total_blob_gas_used,
  COALESCE(SUM(blob_as_calldata_gas_used)::DECIMAL, 0) AS total_blob_as_calldata_gas_used,
  COALESCE(SUM(blob_base_fee)::DECIMAL, 0) AS total_blob_base_fee,
  COALESCE(SUM(blob_max_fee)::DECIMAL, 0) AS total_blob_max_fee,
  COALESCE(SUM(blob_as_calldata_fee)::DECIMAL, 0) AS total_blob_as_calldata_fee,
  COALESCE(SUM(blob_as_calldata_max_fee)::DECIMAL, 0) AS total_blob_as_calldata_max_fee,
  COALESCE(SUM(max_fee_per_blob_gas)::DECIMAL, 0) AS total_max_blob_gas_fee
FROM base
GROUP BY GROUPING SETS (
  (period_start, category),
  (period_start, rollup),
  (period_start)
)
HAVING NOT (
  GROUPING(rollup) = 0 AND
  rollup IS NULL
)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  avg_blob_base_fee = EXCLUDED.avg_blob_base_fee,
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,

  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,

  avg_blob_max_fee = EXCLUDED.avg_blob_max_fee,
  avg_blob_as_calldata_fee = EXCLUDED.avg_blob_as_calldata_fee,
  avg_blob_as_calldata_max_fee = EXCLUDED.avg_blob_as_calldata_max_fee,
  avg_max_blob_gas_fee = EXCLUDED.avg_max_blob_gas_fee,

  total_transactions = EXCLUDED.total_transactions,
  total_unique_receivers = EXCLUDED.total_unique_receivers,
  total_unique_senders = EXCLUDED.total_unique_senders,
  total_blob_gas_used = EXCLUDED.total_blob_gas_used,
  total_blob_as_calldata_gas_used = EXCLUDED.total_blob_as_calldata_gas_used,
  total_blob_base_fee = EXCLUDED.total_blob_base_fee,
  total_blob_max_fee = EXCLUDED.total_blob_max_fee,
  total_blob_as_calldata_fee = EXCLUDED.total_blob_as_calldata_fee,
  total_blob_as_calldata_max_fee = EXCLUDED.total_blob_as_calldata_max_fee,
  total_max_blob_gas_fee = EXCLUDED.total_max_blob_gas_fee
