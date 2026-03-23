WITH base AS (
  SELECT
    DATE_TRUNC('hour', tx.block_timestamp) AS period_start,
    CASE WHEN f.rollup IS NOT NULL THEN 'rollup'::category ELSE 'other'::category END AS category,
    f.rollup,
    tx.block_number,
    tx.hash,
    tx.to_id,
    t.first_block_number_as_receiver                         AS to_first_block_number,
    tx.from_id,
    f.first_block_number_as_sender                           AS from_first_block_number,
    blob_gas_price,
    tx.blob_gas_used,
    tx.blob_as_calldata_gas_used,
    tx.max_fee_per_blob_gas,
    (tx.blob_gas_used * blob_gas_price)                      AS blob_base_fee,
    (tx.blob_gas_used * tx.max_fee_per_blob_gas)             AS blob_max_fee,
    (tx.blob_as_calldata_gas_used * blob_gas_price)          AS blob_as_calldata_fee,
    (tx.blob_as_calldata_gas_used * tx.max_fee_per_blob_gas) AS blob_as_calldata_max_fee
  FROM transaction tx
    JOIN block b ON b.hash = tx.block_hash
    JOIN address f ON f.address = tx.from_id
    JOIN address t ON t.address = tx.to_id
  WHERE tx.block_timestamp >= :from AND tx.block_timestamp < :to
    AND NOT EXISTS (
      SELECT 1 FROM transaction_fork tx_f
      WHERE tx_f.block_hash = tx.block_hash AND tx_f.hash = tx.hash
    )
),
block_metric AS (
  SELECT
    period_start,
    AVG(blob_gas_price)::FLOAT AS avg_blob_gas_price,
    SUM(blob_gas_price)::DECIMAL AS total_blob_gas_price,
    COUNT(*)::INT            AS total_blocks
  FROM (
    SELECT DISTINCT ON (block_number)
      period_start,
      block_number,
      blob_gas_price
    FROM base
  ) deduped_blocks
  GROUP BY period_start
)
INSERT INTO hourly_metrics (
  period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  avg_blob_gas_price,

  total_blob_gas_price,
  total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  avg_blob_base_fee,
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
  base.period_start,
  category,
  rollup,

  -- ------------- GLOBAL-ONLY METRICS -------------
  -- Only computed for the global grouping set (period_start)
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(ANY_VALUE(avg_blob_gas_price), 0)
  END AS avg_blob_gas_price,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(ANY_VALUE(total_blob_gas_price), 0)
  END AS total_blob_gas_price,
  CASE WHEN GROUPING(category) = 1 AND GROUPING(rollup) = 1
    THEN COALESCE(ANY_VALUE(total_blocks), 0)
  END AS total_blocks,

  -- ------------- DIMENSIONAL METRICS -------------
  COALESCE(AVG(blob_base_fee)::FLOAT, 0) AS avg_blob_base_fee,
  COALESCE(AVG(blob_max_fee)::FLOAT, 0) AS avg_blob_max_fee,
  COALESCE(AVG(blob_as_calldata_fee)::FLOAT, 0) AS avg_blob_as_calldata_fee,
  COALESCE(AVG(blob_as_calldata_max_fee)::FLOAT, 0) AS avg_blob_as_calldata_max_fee,
  COALESCE(AVG(max_fee_per_blob_gas)::FLOAT, 0) AS avg_max_blob_gas_fee,

  COUNT(hash)::INT AS total_transactions,
  COUNT(
    DISTINCT CASE
      WHEN to_first_block_number = block_number THEN to_id
    END
  )::INT AS total_unique_receivers,
  COUNT(
    DISTINCT CASE
      WHEN from_first_block_number = block_number THEN from_id
    END
  )::INT AS total_unique_senders,
  COALESCE(SUM(blob_gas_used)::DECIMAL, 0) AS total_blob_gas_used,
  COALESCE(SUM(blob_as_calldata_gas_used)::DECIMAL, 0) AS total_blob_as_calldata_gas_used,
  COALESCE(SUM(blob_base_fee)::DECIMAL, 0) AS total_blob_base_fee,
  COALESCE(SUM(blob_max_fee)::DECIMAL, 0) AS total_blob_max_fee,
  COALESCE(SUM(blob_as_calldata_fee)::DECIMAL, 0) AS total_blob_as_calldata_fee,
  COALESCE(SUM(blob_as_calldata_max_fee)::DECIMAL, 0) AS total_blob_as_calldata_max_fee,
  COALESCE(SUM(max_fee_per_blob_gas)::DECIMAL, 0) AS total_max_blob_gas_fee
FROM base JOIN block_metric ON base.period_start = block_metric.period_start
GROUP BY GROUPING SETS (
  (base.period_start, category),
  (base.period_start, rollup),
  (base.period_start)
)
HAVING NOT (
  GROUPING(rollup) = 0 AND
  rollup IS NULL
)
ON CONFLICT (period_start, category, rollup) DO UPDATE SET
  avg_blob_gas_price = EXCLUDED.avg_blob_gas_price,

  total_blob_gas_price = EXCLUDED.total_blob_gas_price,
  total_blocks = EXCLUDED.total_blocks,

  avg_blob_base_fee = EXCLUDED.avg_blob_base_fee,
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
